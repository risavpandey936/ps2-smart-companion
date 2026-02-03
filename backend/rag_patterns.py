def get_task_pattern(task):
    task = task.lower()

    if any(word in task for word in ["clean", "organize", "room", "desk"]):
        return (
            "Task type: Cleaning\n"
            "- Start with visible items\n"
            "- One category at a time\n"
            "- Prefer physical actions\n"
            "- Avoid perfection"
        )

    if any(word in task for word in ["study", "exam", "prepare", "learn"]):
        return (
            "Task type: Studying\n"
            "- Start with materials, not thinking\n"
            "- Review headings first\n"
            "- Short focused actions\n"
            "- Stop before fatigue"
        )

    if any(word in task for word in ["email", "reply", "submit", "form"]):
        return (
            "Task type: Admin\n"
            "- Open required app first\n"
            "- Handle one item only\n"
            "- Do not clear everything"
        )

    return (
        "Task type: General\n"
        "- Start with the easiest action\n"
        "- Keep steps very small"
    )