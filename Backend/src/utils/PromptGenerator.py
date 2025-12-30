import requests
from fastapi import FastAPI,requests
from .requests_helper import curl
import json
import re

def extract_json_from_text(text: str) -> dict:
    """
    Extracts the first JSON object found in the given text.

    Args:
        text (str): The text containing JSON (may be wrapped in markdown or other text).

    Returns:
        dict: Parsed JSON object, or empty dict if not found or invalid.
    """
    try:
        # Match content inside ```json ... ``` or plain {...}
        match = re.search(r"```(?:json)?\s*({.*?})\s*```", text, re.DOTALL) or re.search(r"({.*})", text, re.DOTALL)
        if match:
            json_str = match.group(1)
            return json.loads(json_str)
    except json.JSONDecodeError:
        pass
    return {}

def prompt_generator(prompt:str,schema:str)->str:
    system_message='''You are a prompt generation assistant. You are given two inputs:

                        1)A user's request in natural language describing a data operation (e.g., SELECT, INSERT, UPDATE, DELETE).

                        2)A SQL database schema, including table names, column names, and data types.

                        Your task is to generate a single, clear, and self-contained prompt that can be given to a code generation model like CodeLlama. The prompt must instruct the model to output only a syntactically correct SQL query that fulfills the user's request using the given schema.

                        Instructions for the prompt you generate:

                        -Ensure that the model produces only a valid SQL query with no explanation or commentary.

                        -Instruct the model to use only valid SQL syntax based on the schema provided.

                        -The prompt must not ask for functions, classes, or any non-SQL elements.

                        -The prompt should explicitly guide the model to produce only the query as output — no markdown, headers, or labels.

                        -The prompt should include the full schema and user request inline.

                        -Do not include any explanation in your response — return only the final prompt string to be passed to the code model.

                        -Do not return this is the generated prompt etc... in the response.
                            '''

    response=curl('chat','POST',
                  {
                      "model":"llama3",
                      "stream":False,
                      "messages":[
                          {"role":"system","content":system_message},
                          {"role":"user","content":f"The user request is {prompt} and the schema or context is {schema}."}
                      ]
                  }
                  )
    content=response["message"].get("content")
    # extracted_json=extract_json_from_text(content)
    return content

def code_generator(prompt: str):
    response = curl("generate", "POST", {
        "model": "codellama",
        "stream": False,
        "prompt": prompt  # make sure this is a plain string
    })
    return response

