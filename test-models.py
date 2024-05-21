import openai

# Set your OpenAI API key
openai.api_key = 'sk-proj-replace-with-your-api-key-if-you-want-wo-test-models'

# Fetch and list all models
def list_openai_models():
    try:
        models = openai.Model.list()
        return [model['id'] for model in models['data']]
    except Exception as e:
        return str(e)

# Fetching the list of available models
available_models = list_openai_models()
print(available_models)