from app.querydatabase.database import get_connection


# Create quiz table
def create_quize_table():

    connection = get_connection()

    query = """
        CREATE TABLE IF NOT EXISTS question(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_answer TEXT NOT NULL,
            marks INTEGER DEFAULT 1,
            time INTEGER
        )
    """

    connection.execute(query)
    connection.commit()
    connection.close()


# Add question
def add_question(question, option_a, option_b, option_c, option_d,
                 correct_answer, marks, time):

    connection = get_connection()

    query = """
        INSERT INTO question
        (question, option_a, option_b, option_c, option_d,
         correct_answer, marks, time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """

    connection.execute(
        query,
        (question, option_a, option_b, option_c, option_d,
         correct_answer, marks, time)
    )

    connection.commit()
    connection.close()


# Get questions
def get_question():

    connection = get_connection()

    query = """
        SELECT * FROM question
    """

    questions = connection.execute(query).fetchall()

    connection.close()

    return questions


# Check answer
def check_answer(question_id, answer):

    connection = get_connection()

    query = """
        SELECT correct_answer, marks
        FROM question
        WHERE id = ?
    """

    result = connection.execute(query, (question_id,)).fetchone()

    connection.close()

    return result


# Delete question
def delete_question(question_id):

    connection = get_connection()

    query = """
        DELETE FROM question
        WHERE id = ?
    """

    connection.execute(query, (question_id,))
    connection.commit()
    connection.close()


