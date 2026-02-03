def is_valid_output(text):
    lines = [l.strip() for l in text.strip().split("\n") if l.strip()]

    if len(lines) == 0 or len(lines) > 8:
        return False

    for i, line in enumerate(lines, start=1):
        if not line.startswith(f"{i}."):
            return False
        if len(line.split()) > 12:
            return False

    return True