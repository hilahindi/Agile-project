FROM python:3.10

WORKDIR /app

# Install bcrypt first to avoid version conflicts and ensure stable backend
RUN pip install --no-cache-dir bcrypt==4.0.1

# Install remaining requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
