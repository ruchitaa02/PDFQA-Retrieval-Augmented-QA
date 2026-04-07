import sys
import os

# Ensure the backend directory is in the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag.agent import get_agent_runnable

def main():
    try:
        # Get the compiled agent (has_images=False is fine for structure)
        app = get_agent_runnable()
        
        # Get the graph representation
        graph = app.get_graph()
        
        # Print the Mermaid diagram
        print("```mermaid")
        print(graph.draw_mermaid())
        print("```")
        
    except Exception as e:
        print(f"Error visualizing graph: {e}")

if __name__ == "__main__":
    main()
