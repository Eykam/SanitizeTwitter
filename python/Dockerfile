FROM python:latest

WORKDIR /app

COPY ./python/requirements.txt ./

RUN pip install -r requirements.txt

COPY ./python ./

CMD ["python","-u", "main.py"]