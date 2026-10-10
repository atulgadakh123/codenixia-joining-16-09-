from pydantic import BaseModel

class questionCreate(BaseModel):
    question :str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: str
    marks: int = 1
    time:int

class BulkQuestionCreate(BaseModel):
    question: list[questionCreate]

class Answer(BaseModel):
    question_id :int
    answer:str
    time:int

class QuizeSubmit(BaseModel):
    answers : list[Answer]