# test_import.py
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-mpnet-base-v2')
print("Model loaded successfully")