# js-chatai
Melkaneas javascript ChatAI using express socket.io axios cluster   

open a terminal  
git clone https://github.com/HarleyVader/js-chatai.git  
cd js-chatai  
npm i express axios socket.io body-parser os cluster dotenv  
node server.js  
in your browser open localhost:3000  

for it to work you need to get openAI api key & create an .env file with your api   
it should look like this  
OPENAI_API_KEY=sk-proj-someverlonggibberish  

edit server.js to change AI model. only use from the selected list in comment or there will be issues as the prompt is not properly formated for other models  
