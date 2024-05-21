# js-chatai
Melkaneas javascript ChatAI using express socket.io axios cluster   

open a terminal  
git clone https://github.com/HarleyVader/js-chatai.git  
cd js-chatai  
npm i 
node server.js  
in your browser open localhost:3000  

for it to work you need to get openAI api key & create an .env file with your api   
it should look like this  
OPENAI_API_KEY=sk-proj-someverlonggibberish  

edit: server.js to change AI models. locked to the selected from the list, there will be issues as the prompt is not properly formated for other models  
         integrate mongodb to create user based settings, templates and conversation history  
         add a pre prompt form to provide a setting that will be repeated over the rest of the conversation or till changed as well as a post prompt form to provide a setting that will be repeated at the end of the conversation or till changed

goals: llms dont have permanence - how to permanance?
        unhinged RPG gpt 
        ability to fine tune the model
