import sqlite3
from datetime import date

def get_connection():
    connection = sqlite3.connect("app/database/quize.db")
    connection.row_factory = sqlite3.Row

    return connection


# create table
def create_users_table():

    connection = get_connection()

    query = """
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            college TEXT NOT NULL,
            division TEXT NOT NULL,
            degree TEXT NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            attendance INTEGER DEFAULT 0,
            attendance_date TEXT
        )
    """

    connection.execute(query)
    connection.commit()
    connection.close()


# create users
def create_users(name, email, college, division, degree, password, role, attendance=0, attendance_date=None):

    connection = get_connection()

    connection.execute("""
        INSERT INTO users
        (name, email, college, division, degree, password, role, attendance, attendance_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (name, email, college, division, degree, password, role, attendance, attendance_date))

    connection.commit()
    connection.close()


# login create
def login_create(email):

    connection = get_connection()

    query = """
        SELECT *
        FROM users
        WHERE email = ?
    """

    user = connection.execute(query, (email,)).fetchone()

    connection.close()

    return user


# update attendance
def update_attendance(email):

    connection = get_connection()

    today = date.today().isoformat()

    query = """
        SELECT attendance, attendance_date
        FROM users
        WHERE email = ?
    """

    user = connection.execute(query, (email,)).fetchone()

    if user is not None:

        attendance = user["attendance"] or 0

        if user["attendance_date"] != today:

            attendance += 1

            update_query = """
                UPDATE users
                SET attendance = ?,
                    attendance_date = ?
                WHERE email = ?
            """

            connection.execute(update_query, (attendance, today, email))
            connection.commit()

    connection.close()

def delete_id(id):
    conn =get_connection()
    cursor= conn.execute("""
            DELETE FROM users
            WHERE id = ?
    """,(id,))

    conn.commit()
    conn.close()
    

