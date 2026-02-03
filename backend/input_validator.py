def is_valid_input(text):
    if not text:
        return False

    text = text.lower().strip()

    # Reject questions and emotional inputs
    blocked_keywords = [
        "why", "feel", "sad", "depressed", "anxious",
        "adhd", "autism", "lazy", "motivation",
        "what is", "how does", "explain"
    ]

    for word in blocked_keywords:
        if word in text:
            return False

    # Too long = likely not a simple task
    if len(text.split()) > 10:
        return False

    return True