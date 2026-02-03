import os
from dotenv import load_dotenv
from groq import Groq

from backend.input_validator import is_valid_input
from backend.output_validator import is_valid_output
from backend.task_utils import split_tasks, prioritize_tasks
from backend.rag_patterns import get_task_pattern


# Load environment variables
load_dotenv()

if not os.getenv("GROQ_API_KEY"):
    raise RuntimeError("GROQ_API_KEY not found in .env")

# Initialize Groq client
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ---- USER INPUT ----
user_input = input(
    "What tasks do you want help starting right now?\n"
    "(You can list more than one, separated by commas)\n> "
).strip()

if not is_valid_input(user_input):
    print("❌ Please enter simple actionable tasks.")
    exit()

# ---- TASK PROCESSING ----
tasks = split_tasks(user_input)
tasks = prioritize_tasks(tasks)

# Avoid cognitive overload
tasks = tasks[:3]


# ---- MAIN LOOP ----
for task in tasks:
    # 🔹 RAG: retrieve task-specific pattern
    pattern = get_task_pattern(task)

    # 🔒 Build system prompt with RAG + strict rules
    system_prompt = (
        "You are an executive-function assistant for neurodivergent users.\n\n"
        f"{pattern}\n\n"
        "Rules:\n"
        "- Output ONLY a numbered list\n"
        "- Maximum 8 steps\n"
        "- One action per line\n"
        "- Each sentence under 12 words\n"
        "- No explanations\n"
        "- No emojis\n"
        "- No extra text"
    )

    print(f"\n🟢 Task: {task}")
    success = False

    # Retry loop (LLM self-correction)
    for _ in range(3):
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": task},
            ],
            temperature=0.2,
            max_tokens=120
        )

        output = response.choices[0].message.content

        if is_valid_output(output):
            print(output)
            success = True
            break

    if not success:
        print("❌ Could not generate valid micro-steps for this task.")