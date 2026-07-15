import re

with open('frontend/src/pages/Admin/AiSettings.tsx', 'r') as f:
    content = f.read()

# Find the Indexing Stats Panel block
start_marker = "          {/* Indexing Stats Panel */}"
end_marker = "        </div>\n      </div>\n    </div>\n  );\n}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    panel_content = content[start_idx:end_idx]
    
    # Change button color inside panel_content
    panel_content = panel_content.replace(
        'className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50"',
        'className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"'
    )

    # Remove it from the current location
    new_content = content[:start_idx] + "\n" + end_marker
    
    # Insert it before {/* Action Panel */}
    insert_marker = "        {/* Action Panel */}"
    insert_idx = new_content.find(insert_marker)
    
    if insert_idx != -1:
        # We want to put it at the end of the left column which is just before {/* Action Panel */}
        # But wait, the left column div closes right before {/* Action Panel */}.
        # The structure is:
        #         </div>
        # 
        #         {/* Action Panel */}
        
        # Let's find the closing div of the left column
        left_col_end = new_content.rfind("        </div>", 0, insert_idx)
        
        if left_col_end != -1:
            # We insert it INSIDE the left column
            final_content = new_content[:left_col_end] + "\n" + panel_content.replace("          {/* Indexing Stats Panel */}", "          {/* Indexing Stats Panel */}") + "\n" + new_content[left_col_end:]
            
            with open('frontend/src/pages/Admin/AiSettings.tsx', 'w') as f:
                f.write(final_content)
            print("Successfully updated layout and button color.")
        else:
            print("Could not find left column end.")
    else:
        print("Could not find Action Panel marker.")
else:
    print("Could not find panel boundaries.")
