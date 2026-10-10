from app.querydatabase.database import get_connection


# Create result table
def create_result():

    connection = get_connection()

    query = """
        CREATE TABLE IF NOT EXISTS quize_result(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            marks INTEGER NOT NULL,
            total_time INTEGER NOT NULL
        )
    """

    connection.execute(query)
    connection.commit()
    connection.close()


# Insert result
def insert_result(student_id, marks, total_time):

    connection = get_connection()

    query = """
        INSERT INTO quize_result
        (student_id, marks, total_time)
        VALUES (?, ?, ?)
    """

    connection.execute(query, (student_id, marks, total_time))

    connection.commit()
    connection.close()


# Get leaderboard
def get_leadrbord():

    connection = get_connection()

    query = """
        SELECT
            users.id AS student_id,
            users.email,
            users.name,
            users.attendance,
            quize_result.marks,
            quize_result.total_time
        FROM quize_result
        JOIN users
        ON quize_result.student_id = users.id
        ORDER BY quize_result.marks DESC,
                 quize_result.total_time ASC
        LIMIT 10
    """

    result = connection.execute(query).fetchall()

    connection.close()

    return result