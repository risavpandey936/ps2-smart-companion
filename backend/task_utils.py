def split_tasks(text):
    # Normalize separators
    text = text.replace(" and ", ",")
    tasks = [t.strip().capitalize() for t in text.split(",") if t.strip()]
    return tasks


def prioritize_tasks(tasks):
    """
    Neuro-friendly ordering:
    - Physical / simple tasks first
    - Shorter tasks first
    """

    def score(task):
        task = task.lower()
        score = 0

        # Physical / easy actions first
        if any(word in task for word in ["clean", "organize", "pick", "reply", "send"]):
            score += 2

        # Cognitive-heavy later
        if any(word in task for word in ["study", "prepare", "exam", "assignment"]):
            score -= 1

        # Shorter task first
        score -= len(task.split())

        return score

    return sorted(tasks, key=score, reverse=True)