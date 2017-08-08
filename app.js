var restify = require('restify');
var builder = require('botbuilder');



// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

//Recognizers

var EnglishRecognizers = {
        SupportRecognizer : new builder.RegExpRecognizer( "EN-Support", /(^(?=.*(not working|fix|i want to fix|fix)))/i),
        //investRecognizer : new builder.RegExpRecognizer( "WantAR", /(مستثمر|إستثمار|أريد أن استثمر)/i),
        // greetingRecognizer : new builder.RegExpRecognizer( "Greeting", /(السلام عليكم|صباح الخير|مساء الخير|مرحباً)/i),
        // arabicRecognizer : new builder.RegExpRecognizer( "Arabic", /(العربية)/i), 
        // englishRecognizer : new builder.RegExpRecognizer( "English", /(English)/i)
    }

var intents = new builder.IntentDialog({ recognizers: [
    EnglishRecognizers.SupportRecognizer,
    ] 
})

.matches("EN-Support",(session,args)=>{
    var isSupport = true;
    if(isSupport){
        session.send("Your first intent saids: %s", JSON.stringify(args));
        // if(!session.conversationData.applicationSubmitted)
        // {
        //     session.replaceDialog("wantToInvest");
        // }
        // else{
        //     session.replaceDialog("askagain");
        // }
    }
    else{
        session.send("cannotUnderstand");;
        session.endDialog();
    }
})


// Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("You saids: %s", session.message.text);

});

