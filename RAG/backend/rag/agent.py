from typing import Annotated, Literal, TypedDict, List, Optional
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, BaseMessage, ToolMessage
from langgraph.graph.message import add_messages
import os
import json
from dotenv import load_dotenv
from rag.retriever import retrieve
from storage.chat_store import search_messages

load_dotenv()

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

@tool
def retrieve_documents(query: str):
    """Retrieve relevant documents from the knowledge base based on the query.
    Returns a JSON string containing the list of documents.
    """
    results = retrieve(query, top_k=3)
    if not results:
        return "No relevant documents found."
    
    # Format as JSON for the LLM and for parsing later
    formatted_results = []
    for res in results:
        meta = res["metadata"]
        formatted_results.append({
            "source": meta.get('source', 'Unknown'),
            "page": meta.get('page'),
            "type": meta.get('type', 'text'),
            "content": meta.get('content', ''),
            "score": res.get("score", 0),
            "path": meta.get('path')
        })
    
    return json.dumps(formatted_results)

@tool
def search_chat_history(query: str):
    """Search through all past conversations/chats for messages matching the query.
    Use this tool when the user refers to something discussed in a previous chat session.
    Returns a JSON string of matching messages.
    """
    results = search_messages(query)
    if not results:
        return "No matching messages found in chat history."
    
    # Format results to include source info
    formatted_results = []
    for res in results[:10]:
        formatted_results.append({
            "source": f"Chat: {res['chat_title']}",
            "type": "chat_history",
            "content": res['content'],
            "score": 1.0, # High score for exact history matches
            "path": None
        })
    
    return json.dumps(formatted_results)

tools = [retrieve_documents, search_chat_history]

from langchain_ollama import ChatOllama

# Initialize models
llm_versatile = ChatOllama(
    model="qwen3-vl:235b-cloud",
    temperature=0,
    timeout=600  # 10 minute timeout for large model
).bind_tools(tools)

# Vision model (does not support tools, used only for one-off descriptions)
vision_llm = ChatOllama(
    model="qwen3-vl:235b-cloud",
    temperature=0,
    timeout=600
)

def get_agent_runnable():
    def reasoner(state: AgentState):
        return {"messages": [llm_versatile.invoke(state["messages"])]}

    graph_builder = StateGraph(AgentState)
    graph_builder.add_node("reasoner", reasoner)
    graph_builder.add_node("tools", ToolNode(tools))

    graph_builder.add_edge(START, "reasoner")
    graph_builder.add_conditional_edges("reasoner", tools_condition)
    graph_builder.add_edge("tools", "reasoner")

    return graph_builder.compile()

def run_agent(query: str, history: List[dict] = [], images: List[str] = [], attachment_name: str = None):
    """
    Run the LangGraph agent.
    Returns: (final_answer_string, list_of_sources)
    """
    messages = []
    
    system_prompt = (
        "You are OmniRAG, a highly advanced multimodal AI assistant. "
        "You have access to a knowledge base (including text AND IMAGES) via 'retrieve_documents' and past chats via 'search_chat_history'.\n\n"
        
        "**CRITICAL RULES ABOUT IMAGES:**\n"
        "- If a user asks 'what images do you have', 'explain the image I uploaded', or asks about a visual diagram, **YOU MUST USE the 'retrieve_documents' tool** to search the FAISS vector database.\n"
        "- Images the user uploaded in the past are securely stored in the vector database as highly detailed text descriptions. You CAN recall them perfectly by using the retrieval tool.\n"
        "- **NEVER say you cannot view, retain, or recall images.** You CAN retrieve them using your tools.\n\n"
        
        "**STRATEGY FOR ANSWERING:**\n"
        "1. **CLASSIFY THE QUERY**:\n"
        "   - **Conversational/General** (e.g., 'hello', 'thank you', 'write a poem'): \n"
        "     -> Answer directly using your own knowledge. **DO NOT** use any tools.\n"
        "   - **Specific/Information Retrieval/Images** (e.g., 'what images do you have?', 'explain the architecture diagram', 'what does the report say?'): \n"
        "     -> Use 'retrieve_documents' or 'search_chat_history'.\n\n"
        
        "2. **IF TOOLS ARE USED BUT RETURN NOTHING**: \n"
        "   - Provide a helpful answer based on your knowledge, but specify you couldn't find it in the documents.\n"
        "3. **IF TOOLS RETURN DATA**: Use that data to answer the user explicitly and accurately.\n\n"
        "If the user attaches a new image right now, you will automatically receive a generated textual description of it appended to their query."
    )
    
    messages.append(SystemMessage(content=system_prompt))
    
    # Add history
    for msg in history:
        if msg["role"] == "user":
            messages.append(HumanMessage(content=msg["content"]))
        elif msg["role"] == "assistant":
            messages.append(AIMessage(content=msg["content"]))
            
    # Add current message with potential inline images routed directly to single agent
    content_list = [{"type": "text", "text": query}]
    if attachment_name:
        content_list[0]["text"] += f"\n[User attached file: {attachment_name}]"
        
    if images:
        for img in images:
            content_list.append({
                "type": "image_url", 
                "image_url": {"url": f"data:image/jpeg;base64,{img}"}
            })
            
    messages.append(HumanMessage(content=content_list))
    
    # Run the agent
    agent = get_agent_runnable()
    result = agent.invoke({"messages": messages})
    
    final_content = result["messages"][-1].content
    
    # Extract sources from ToolMessages
    sources = []
    for msg in result["messages"]:
        if isinstance(msg, ToolMessage):
             try:
                 data = json.loads(msg.content)
                 if isinstance(data, list):
                     for item in data:
                         # Ensure we capture sources from both document retrieval and chat history
                         source_name = item.get("source", "Unknown")
                         
                         sources.append({
                             "source": source_name,
                             "type": item.get("type", "text"),
                             "score": item.get("score", 0),
                             "path": item.get("path")
                         })
             except:
                 pass
                 
    return final_content, sources

def generate_chat_title(first_message: str):
    """Generates a short title for the chat based on the first message."""
    # Instantly generate a title using string slicing rather than invoking a massive LLM
    try:
        words = first_message.split()
        title = " ".join(words[:5])
        if len(words) > 5:
            title += "..."
        return title.strip()
    except Exception as e:
        print(f"Error generating title: {e}")
        return "New Chat"
