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

var bot = new builder.UniversalBot(connector,{
    localizerSettings: { 
        defaultLocale: "en" 
    }   
});

//Recognizers

var EnglishRecognizers = {
        EnSupportRecognizer : new builder.RegExpRecognizer( "EnSupport", /(^(?=.*(not working|fix|i want to fix|fix)))/i),
        EnGreetingsRecognizer : new builder.RegExpRecognizer( "EnGreetings", /(Hi|hello|good morning|good evening|good afternoon|)/i),
        // greetingRecognizer : new builder.RegExpRecognizer( "Greeting", /(السلام عليكم|صباح الخير|مساء الخير|مرحباً)/i),
        // arabicRecognizer : new builder.RegExpRecognizer( "Arabic", /(العربية)/i), 
        // englishRecognizer : new builder.RegExpRecognizer( "English", /(English)/i)
    }

var intents = new builder.IntentDialog({ recognizers: [
    EnglishRecognizers.EnSupportRecognizer,
    EnglishRecognizers.EnGreetingsRecognizer,
    ] 
})

.matches("EnSupport",(session,args)=>{
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
.matches('EnGreetings',(session, args) => {
    session.send("cannotUnderstand");
})
.matches('None',(session, args) => {
    session.send("cannotUnderstand");
})

var program = {
    Constants:{
        questionsBeforeInvest : 5,
        questionBeforeGenericHelp : 3,
        EmailTemplate : {
            Content:{
                en:"Dear {{user}} <br/> Thanks alot for your interest in investing in Manateq, our team will study your inquiry and will get back to you as soon as possible <br/><table border=1><tr><td>Mobile</td><td>{{mobile}}</td></tr><tr><td>Zone</td><td>{{zone}}</td></tr><tr><td>Sector</td><td>{{sector}}</td></tr><tr><td>Operation</td><td>{{operation}}</td></tr><tr><td>Heard</td><td>{{heard}}</td></tr><tr><td>Comment</td><td>{{comment}}</td></tr></table><br/>Regards,<br/>Manateq Team",
                ar:"<div style='direction:rtl'> عزيزي {{user}} <br/> شكراً على اهتمامك بالاستثمار في مناطق، سوف نقوم بدراسة طلبك والرد عليك بأقرب فرصة ممكنة <br/><br/><table border=1><tr><td>رقم جوالك</td><td>{{mobile}}</td></tr><tr><td>اهتماماتك</td><td>{{zone}}</td></tr><tr><td> قطاع</td><td>{{sector}}</td></tr><tr><td>نوع العمل</td><td>{{operation}}</td></tr><tr><td>كيف سمعت عن شركة مناطق؟</td><td>{{heard}}</td></tr><tr><td>الاستعلام عنه</td><td>{{comment}}</td></tr></table><br/> مع تحيات فريق عمل مناطق</div>"
            },
            Subject:{
                en:"Thanks from Manateq",
                ar:"شكراً من مناطق"
            }
        },
        YesNo : {
            en:"Yes|No",
            ar:"نعم|كلا"
        }
    },
    Options:{
        Zones: {
            en:{
                "Ras Bufontas":{Description:"Ras Bufontas"},
                "Ym Alhaloul":{Description:"Ym Alhaloul"},
                "I’m not sure":{Description:"I’m not sure"}
            },
            ar:{
                "راس أبوفنطاس":{Description:"راس أبوفنطاس"},
                "أم الهلول":{Description:"أم الهلول"},
                "لست متأكد":{Description:"لست متأكد"}
            }
        },
        Sectors: {
            en:{
                "Aviation/Aerospace":{Description:"Aviation/Aerospace"},
                "Constitutions & Engineering (excluding main or subcontractor)":{Description:"Constitutions & Engineering (excluding main or subcontractor)"},
                "Construction Materials (including green/sustainable)":{Description:"Construction Materials (including green/sustainable)"},
                "Electrical equipment":{Description:"Electrical equipment"},
                "Food & Beverage processing":{Description:"Food & Beverage processing"},
                "Healthcare Equipment/Services":{Description:"Healthcare Equipment/Services"},
                "ICT (Hardware, software, new media)":{Description:"ICT (Hardware, software, new media)"},
                "Logistics/Transportation":{Description:"Logistics/Transportation"},
                "Machinery":{Description:"Machinery"},
                "Metals (intermediate and finished goods)":{Description:"Metals (intermediate and finished goods)"},
                "Nonprofit/NGO/Government/Semi-government":{Description:"Nonprofit/NGO/Government/Semi-government"},
                "Oil & Gas Equipment":{Description:"Oil & Gas Equipment"},
                "Oil & Gas Services":{Description:"Oil & Gas Services"},
                "Pharmaceutical/Biotechnology/Life Science":{Description:"Pharmaceutical/Biotechnology/Life Science"},
                "Plastics (intermediate and finished goods)":{Description:"Plastics (intermediate and finished goods)"},
                "Professional/Business/Commercial Services":{Description:"Professional/Business/Commercial Services"},
                "Renewable/Sustainable Technology":{Description:"Renewable/Sustainable Technology"},
                "Vehicles (light and heavy manufacturing, including components)":{Description:"Vehicles (light and heavy manufacturing, including components)"},
                "Wholesale/Distributor/Trader/Retail":{Description:"Wholesale/Distributor/Trader/Retail"}
            },
            ar:{
                "الأتصالات وتكنولوجيا المعلومات (الأجهزة، البرمجيات، وسائل الأعلام الحديثة)":{Description:"الأتصالات وتكنولوجيا المعلومات (الأجهزة، البرمجيات، وسائل الأعلام الحديثة)"},
                "الآليات":{Description:"الآليات"},
                "الأمداد والتجهيز/النقل":{Description:"الأمداد والتجهيز/النقل"},
                "البلاستيكيات (سلع النهائية والوسيطة)":{Description:"البلاستيكيات (سلع النهائية والوسيطة)"},
                "الصناعات الدوائية/التكنولوجية الحيوية/علم الحياة":{Description:"الصناعات الدوائية/التكنولوجية الحيوية/علم الحياة"},
                "الصناعات الهندسية والبنى الأساسية (بستثناء المتعاقدين الرئيسيين والفرعيين)":{Description:"الصناعات الهندسية والبنى الأساسية (بستثناء المتعاقدين الرئيسيين والفرعيين)"},
                "الطيران/الصناعات الجوية":{Description:"الطيران/الصناعات الجوية"},
                "العربات (التصنيع الخفيف والثقيل بمافي ذلك الأجزاء)":{Description:"العربات (التصنيع الخفيف والثقيل بمافي ذلك الأجزاء)"},
                "المعادن (سلع النهائية والوسيطة)":{Description:"المعادن (سلع النهائية والوسيطة)"},
                "بيع الجملة/التوزيع/التجاري/التجزئة":{Description:"بيع الجملة/التوزيع/التجاري/التجزئة"},
                "تجهيز المواد الغذائية والمشروبات":{Description:"تجهيز المواد الغذائية والمشروبات"},
                "تكنولوجيا إعادة التجديد / الأستدامة":{Description:"تكنولوجيا إعادة التجديد / الأستدامة"},
                "خدمات النفط والغاز":{Description:"خدمات النفط والغاز"},
                "خدمات حرفية/أعمال/تجارية":{Description:"خدمات حرفية/أعمال/تجارية"},
                "خدمات ومعدات الرعاية الصحية":{Description:"خدمات ومعدات الرعاية الصحية"},
                "غير ربحية/مجتمع مدني/حكومي/شبه حكومي":{Description:"غير ربحية/مجتمع مدني/حكومي/شبه حكومي"},
                "معدات الكهربائية":{Description:"معدات الكهربائية"},
                "معدات النفط والغاز":{Description:"معدات النفط والغاز"},
                "مواد البناء (بما في ذلك الخضراء / المتوافقة مع مفهوم الأستدامة)":{Description:"مواد البناء (بما في ذلك الخضراء / المتوافقة مع مفهوم الأستدامة)"}
            }
        },
        Operations: {
            en:{
                "Assembly facility":{Description:"Assembly facility"},
                "Call Center":{Description:"Call Center"},
                "Corporate / Reginoal HQ":{Description:"Corporate / Reginoal HQ"},
                "Maintenance & Repair Facility":{Description:"Maintenance & Repair Facility"},
                "Marketing / Sales Office":{Description:"Marketing / Sales Office"},
                "Production facility":{Description:"Production facility"},
                "Training Facility":{Description:"Training Facility"},
                "Warehouse / Distribution Center":{Description:"Warehouse / Distribution Center"}
            },
            ar:{
                "مرافق الأنتاج":{Description:"مرافق الأنتاج"},
                "مرافق التجميع":{Description:"مرافق التجميع"},
                "مرافق التدريب":{Description:"مرافق التدريب"},
                "مرافق الصيانة والأصلاح":{Description:"مرافق الصيانة والأصلاح"},
                "مركز الأتصال":{Description:"مركز الأتصال"},
                "مركز التخزين / التوزيع":{Description:"مركز التخزين / التوزيع"},
                "مقر الشركة المحلي / الأقليمي":{Description:"مقر الشركة المحلي / الأقليمي"},
                "مكاتب التسويق / المبيعات":{Description:"مكاتب التسويق / المبيعات"}
            }
        },
         ManualHelp:{
            en:{
                "Call Us":{ 
                    Title:"Call Us", 
                    Description:"+974 40323333",        
                },
                "Visit Us":{
                    Title:"Visit Us", 
                    Description:"Visit Us",  
                },
                "Ask us to call you back":{
                    Title:"Ask us to call you back", 
                    Description:"please select one of the below",   
                }
            },
            ar:{
                "اتصل بنا عبر الهاتف":{ 
                    Title:"اتصل بنا عبر الهاتف", 
                    Description:"+974 40323333",        
                },
                "زرنا في مكاتبنا":{
                    Title:"زرنا في مكاتبنا", 
                    Description:"زرنا في مكاتبنا",  
                },
                "اطلب منا ان نتصل بك":{
                    Title:"اطلب منا ان نتصل بك", 
                    Description:"please select one of the below",   
                }
            },
        },
        Languages:"العربية|English"
    },
    Init : function(){
        program.RegisterDialogs();
        bot.dialog("/",intents);
    },
    IntentHelper:{
        url : "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/0cfcf9f6-0ad6-47c3-bd2a-094f979484db?subscription-key=13b10b366d2743cda4d800ff0fd10077&timezoneOffset=0&verbose=true&q=",
        GetIntent:function(search){
                var deferred  = Q.defer();
                https.get(program.IntentHelper.url + search, (res) => {
                var body = '';
                res.on('data', (d) => {
                body += d;
                });
                res.on('end', function(){
                    deferred.resolve(body);
                });
                }).on('error', (e) => {
                 deferred.reject(err);
                });
                return deferred.promise;
        }
    },
    RegisterDialogs : function(){

         bot.dialog("askagain",[
            function(session,results){
               builder.Prompts.choice(session, "alreadySubmitted" ,program.Constants.YesNo[session.preferredLocale()],{listStyle: builder.ListStyle.button});
            },
            function(session,results){
                var index = results.response.index;
                if(index==0)
                {
                    session.replaceDialog("invest");
                }
                else{
                    session.endDialog();
                }
            }
        ]);
        bot.dialog("welcome",[
            function(session,results){
                if(session.conversationData.name == null){
                    builder.Prompts.text(session,"askForEmail");
                }
                else{
                    session.send("greetingAgain",session.conversationData.name)
                    session.endDialog();
                }
            },
            function(session,results){
                var name = results.response;
                session.conversationData.name = name;
                session.endDialog("greetingAsk",name);
            }
        ]);
        bot.dialog("invest",[
            function(session,args){
                session.beginDialog("getname");    
            },
            function(session,results){ //get email
                session.dialogData.name = session.conversationData.name;
                session.beginDialog("getEmail");
            },
            function(session,results){ //get mobile
                session.dialogData.email = results.response;
                //builder.Prompts.text(session,"getMobileNumber");
                session.beginDialog("getMobile");
            },
            function(session,results){ //get zone
                session.dialogData.mobile = results.response;
                var zones = program.Helpers.GetOptions(program.Options.Zones,session.preferredLocale());
                builder.Prompts.choice(session, "getZones", zones,{listStyle: builder.ListStyle.button});
            },
            function(session,results){ //get sector
                session.dialogData.zone = results.response.entity;
                var sectors = program.Helpers.GetOptions(program.Options.Sectors,session.preferredLocale());
                builder.Prompts.choice(session, "getSectors", sectors,{listStyle: builder.ListStyle.button});
            },
            function(session,results){ //get operation
                session.dialogData.sector = results.response.entity;
                var operations = program.Helpers.GetOptions(program.Options.Operations,session.preferredLocale());
                //نوع العمل الذي ترغب بتأسيسة
                builder.Prompts.choice(session, "getOperations", operations,{listStyle: builder.ListStyle.button});
            },
            function(session,results){ //get how you heard about us
                session.dialogData.operation = results.response.entity;
                builder.Prompts.text(session, "getHowYouHeard");
            },
            function(session,results){ //get comment
                session.dialogData.heard = results.response;
                builder.Prompts.text(session, "addComment");
            },
            function(session,results){ // end
                session.dialogData.comment = results.response;
                
                //Send Email
                program.Helpers.SendEmail({
                    email:session.dialogData.email,
                    user:session.dialogData.name,
                    mobile:session.dialogData.mobile,
                    zone:session.dialogData.zone,
                    sector:session.dialogData.sector,
                    operation:session.dialogData.operation,
                    heard:session.dialogData.heard,
                    comment:session.dialogData.comment
                },session.preferredLocale());
                session.send("thanksInquiry",session.dialogData.email);
                session.conversationData.applicationSubmitted = true;
                session.endDialog();
            }
        ]);
        bot.dialog("getname",[
            function(session){ //get girst name
                if(session.conversationData.name == null){
                    builder.Prompts.text(session,"firstNamePlease");
                }
                else{
                    session.endDialog();
                }
            },
            function(session,results){ 
                session.conversationData.name = results.response;
                session.endDialog();
            }
        ]);
        bot.dialog("getEmail",[
            function(session,args){
                if (args && args.reprompt) {
                    builder.Prompts.text(session, "validEmail");
                } else {
                builder.Prompts.text(session, "enterEmail");
                }
            },
            function(session,results)
            {
                var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                if(re.test(results.response))
                    session.endDialogWithResult(results);
                else
                    session.replaceDialog('getEmail', { reprompt: true });
            }
        ]);
        bot.dialog("getMobile",[
            function(session,args){
                if (args && args.reprompt) {
                    builder.Prompts.text(session, "validMobile");
                } else {
                builder.Prompts.text(session, "getMobileNumber");
                }
            },
            function(session,results)
            {
                var re = /[0-9]{8}/;
                if(re.test(results.response))
                    session.endDialogWithResult(results);
                else
                    session.replaceDialog('getMobile', { reprompt: true });
            }
        ]);
        bot.dialog("wantToInvest",[
            function(session,results){
                builder.Prompts.choice(session, "maybeinInvestor",program.Constants.YesNo[session.preferredLocale()],{listStyle: builder.ListStyle.button});
            },
            function(session,results){
                var result = results.response.index;
                if(result == 0){
                    session.replaceDialog("invest");
                }
                else{
                    session.send("thanks");
                    session.conversationData.applicationSubmitted = true;
                    session.endDialog();
                }
            }
        ]);
        bot.dialog("manualHelp",[
            function(session){
                
                var locale = session.preferredLocale();
                builder.Prompts.choice(session, "manualHelpText", program.Options.ManualHelp[locale],{listStyle: builder.ListStyle.button});
            },
            function(session,results){
                var index = JSON.stringify(results.response.index);
                var locale = session.preferredLocale();
                if(index == 0){
                    session.send(program.Options.ManualHelp[locale][results.response.entity].Description).endDialog();
                }
                if(index == 1){
                    session.send("<iframe style='height:300px' src='https://gis.manateq.qa/manateq/manateqmain.aspx?language=ar'></iframe>").endDialog();
                }
                //program.Options.ManualHelp[locale]
                if(index == 2){
                    session.replaceDialog("invest");
                }
            }])
        bot.dialog("setLanguage",[
            function(session){
                if(session.conversationData.lang == null)
                {
                    builder.Prompts.choice(session, "selectYourLanguage",program.Options.Languages,{listStyle: builder.ListStyle.button});
                }else{
                    session.endDialog();
                }
            },
            function(session,results){
               var locale = program.Helpers.GetLocal(results.response.index);
               session.conversationData.lang = locale;
               session.preferredLocale(locale,function(err){
                   if(!err){
                      session.send("welcome");
                      session.endDialog();
                   }
               });
               
            }
        ]);
        bot.dialog("setLanguageWithPic",[
            function(session){
                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                var txt = session.localizer.gettext("en","selectYourLanguage");
                msg.attachments([
                new builder.HeroCard(session)
                    .title("Manateq")
                    .text(txt)
                    .images([builder.CardImage.create(session, "https://www.manateq.qa/Style%20Library/MTQ/Images/logo.png")])
                    .buttons([
                        builder.CardAction.imBack(session, "English", "English"),
                        builder.CardAction.imBack(session, "العربية", "العربية"),
                    ])
                ]);
                builder.Prompts.choice(session, msg, "العربية|English");
            }
            ,
            function(session,results){
               var locale = program.Helpers.GetLocal(results.response.index);
               session.conversationData.lang = locale;
               session.preferredLocale(locale,function(err){
                   if(!err){
                      session.send("welcomeText");
                      session.endDialog();
                   }
               });
               
            }
        ])
    },
    Helpers: {
        GetLocal : function(val){
            return val == "1" ? "en" : "ar";
        },
        GetOptions : function(option,locale){
            return option[locale];
        },
        SendEmail : function(data,locale){
            var html = program.Constants.EmailTemplate.Content[locale];
            var subject = program.Constants.EmailTemplate.Subject[locale];
            html = html.replace("{{user}}",data.user);
            html = html.replace("{{mobile}}",data.mobile);
            html = html.replace("{{zone}}",data.zone);
            html = html.replace("{{sector}}",data.sector);
            html = html.replace("{{operation}}",data.operation);
            html = html.replace("{{heard}}",data.heard);
            html = html.replace("{{comment}}",data.comment);
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'rattazataom@gmail.com',
                    pass: '!!xuloloL'
                }
            });
            var mailOptions = {
                from: 'rattazataom@gmail.com',
                to: data.email,
                subject: subject,
                html: html,
                
            };
            transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
            });
        },
        IsInvestmentIntent: function(args){
            if(args.entities == null || args.entities.length == 0)
                return false;
            return args.entities[0].entity == "invest" || 
            args.entities[0].entity == "investment" ||
            args.entities[0].entity == "investing" ||
            args.entities[0].entity == "land";
        }
    } 
 
}

program.Init();

// // Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("You saids: %s", session.message.text);

// });

