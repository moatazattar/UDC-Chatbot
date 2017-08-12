var restify = require('restify');
var builder = require('botbuilder');
var https = require('https');
var nodemailer = require('nodemailer');
var DynamicsWebApi = require('dynamics-web-api');
var AuthenticationContext = require('adal-node').AuthenticationContext;
var dynamicsWebApi = new DynamicsWebApi({ 
    webApiUrl: 'https://advancyaqatar0.crm4.dynamics.com/api/data/v8.2/',
    onTokenRefresh: acquireToken
});

Q = require('q');


var authorityUrl = 'https://login.microsoftonline.com/d022f938-d149-41eb-89fc-2792c9c82ee2/oauth2/token';
var resource = 'https://advancyaqatar0.crm4.dynamics.com';
var clientId = 'a5fca245-2eb5-469b-9a36-445203c29a9b';
var username = 'moatazattar@advancyaQatar.onmicrosoft.com';
var password = '1!!xuloloL';
var adalContext = new AuthenticationContext(authorityUrl);
function acquireToken(dynamicsWebApiCallback){
    function adalCallback(error, token) {
        if (!error){
            dynamicsWebApiCallback(token);
        }
        else{
            session.send(JSON.stringify(error));
        //    console.log(error.stack);
        }
    }
    adalContext.acquireTokenWithUsernamePassword(resource, username, password, clientId, adalCallback);
}
// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});

// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId:"a3333504-92be-478d-9044-2687ac34a67b",// process.env.MICROSOFT_APP_ID,
    appPassword:"2KPruHcVZwzPveUwsGpeNqc"// process.env.MICROSOFT_APP_PASSWORD
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector,{
    localizerSettings: { 
        defaultLocale: "en" 
    }   
});

//Recognizers
/**
 *session.conversationData.name
 session.conversationData.Email
 session.conversationData.IsResident

 */

var EnglishRecognizers = {
        EnSupportRecognizer : new builder.RegExpRecognizer( "EnSupport", /(^(?=.*(not working|fix|i want to fix|fix)))/i),
        EnGreetingsRecognizer : new builder.RegExpRecognizer( "EnGreetings", /(Hi|hello|good morning|good evening|good afternoon|)/i),
        // greetingRecognizer : new builder.RegExpRecognizer( "Greeting", /(السلام عليكم|صباح الخير|مساء الخير|مرحباً)/i),
        arabicRecognizer : new builder.RegExpRecognizer( "Arabic", /(العربية)/i), 
        englishRecognizer : new builder.RegExpRecognizer( "English", /(English)/i)
    }

var intents = new builder.IntentDialog({ recognizers: [
    EnglishRecognizers.EnSupportRecognizer,
    EnglishRecognizers.EnGreetingsRecognizer,
    EnglishRecognizers.arabicRecognizer,
    EnglishRecognizers.englishRecognizer,
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
     
})
.matches('English',(session, args) => {
    session.send('English');
    var locale ="en";
    session.conversationData.lang = "en";
    session.preferredLocale(locale,function(err){
        if(!err){
            session.send("welcomeText");
            var UserTypes = program.Helpers.GetOptions(program.Options.UserType,session.preferredLocale());
            builder.Prompts.choice(session, "getUserType", UserTypes,{listStyle: builder.ListStyle.button});
        };
    })
})
.matches('Arabic',(session, args) => {
    session.send('Arabic');
    var locale ="ar";
    session.conversationData.lang = locale;
    session.preferredLocale(locale,function(err){
        if(!err){
            session.send("welcomeText");
            var UserTypes = program.Helpers.GetOptions(program.Options.UserType,session.preferredLocale());
            builder.Prompts.choice(session, "getUserType", UserTypes,{listStyle: builder.ListStyle.button});
        };
    })
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
                en:"Dear {{user}} <br/> Thanks alot for your interest in UDC, our team will study your inquiry and will get back to you as soon as possible <br/><table border=1><tr><td>Mobile</td><td>{{mobile}}</td></tr><tr><td>property</td><td>{{property}}</td></tr><tr><td>Heard</td><td>{{heard}}</td></tr><tr><td>Comment</td><td>{{comment}}</td></tr></table><br/>Regards,<br/>UDC Team",
                ar:"<div style='direction:rtl'> عزيزي {{user}} <br/> شكراً على اهتمامك بعقارات الشركه المتحده، سوف نقوم بدراسة طلبك والرد عليك بأقرب فرصة ممكنة <br/><br/><table border=1><tr><td>رقم جوالك</td><td>{{mobile}}</td></tr><tr><td>اهتماماتك</td><td>{{property}}</td></tr><tr><td>كيف سمعت عن شركة مناطق؟</td><td>{{heard}}</td></tr><tr><td>الاستعلام عنه</td><td>{{comment}}</td></tr></table><br/> مع تحيات فريق عمل الشركه المتحده</div>"
            },
            Subject:{
                en:"Thanks from UDC",
                ar:"شكراً من الشركه المتحده"
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
        UserType:{
            en:{
                "Looking For Property":{Description:"Looking For Property"},
                "Current Resident":{Description:"Current Resident"}
            },
            ar:{
                "تبحث عن عقار / منزل":{Description:"تبحث عن عقار / منزل"},
                "ساكن":{Description:"ساكن"}
            }
        },
        AlreadyUser:{
            en:{
               "Yes":{Description:"Yes"},
                "No":{Description:"No"},
            },
            ar:{
               "نعم":{Description:"نعم"},
                "لا":{Description:"لا"},
            }
        },
        PropertyInterest:{
            en:{
               "Yes":{Description:"Yes"},
                "No":{Description:"No"},
                "Show All":{Description:"Show All"}
            },
            ar:{
                "نعم":{Description:"نعم"},
                "لا":{Description:"لا"},
                "إظهر الكل":{Description:"إظهر الكل"}
            }
        },
        Services:{
            en:{
                "Inquiry":{Description:"Inquiry"},
                "Complaint":{Description:"Complaint"},
                "Cleaning Issue":{Description:"Cleaning Issue"},
                "Security":{Description:"Security"},
                "Facility Management":{Description:"Facility Management"},
                "Promotion":{Description:"Promotion"},
                "Adding Related Customer":{Description:"Adding Related Customer"},
                "Retail Store Details":{Description:"Retail Store Details"},
            },
            ar:{
                "Inquiry":{Description:"Inquiry"},
                "Complaint":{Description:"Complaint"},
                "Cleaning Issue":{Description:"Cleaning Issue"},
                "Security":{Description:"Security"},
                "Facility Management":{Description:"Facility Management"},
                "Promotion":{Description:"Promotion"},
                "Adding Related Customer":{Description:"Adding Related Customer"},
                "Retail Store Details":{Description:"Retail Store Details"},
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
        AvailableProperty:{
            en:{
                "Location":{ 
                    Cards : false,
                    Title:"Location", 
                    Description:"please select one of the below locations",
                    Items:{
                        "Ras Abu Funtas": {
                            Cards : false,
                            Title:"west bay",
                            Description:"An area of 4.01 km², situated adjacent to Do​​ha’s new Hamad International Airport, Ras Bufontas is an ideal location for businesses requiring international connectivity.<br/>Ras Bufontas is set to become an advanced technology and logistics hub for the region, attracting regional and global business, trade, and investment thereby contributing to the Qatari Government’s vision of becoming a SMART nation.<br/>This Zone will provide a vibrant and inspiring workplace. A long-lasting, high-quality, and low-maintenance design includes service hubs, public spaces, land for labour accommodation, utilities access, versatile office and retail space, and our Headquarters.<br/>With the Gulf Region and beyond on ​the doorstep, the world-class infrastructure at Ras Bufontas will help your business to grow both within and outside of Qatar.​​​"
                        },
                        "Um Al Houl": {
                            Cards : false,
                            Title:"west bay",
                            Description:"it is in the fourth street blabla"
                        }
                    }           
                },
                "Working Hours":{
                    Cards : false,
                    Title:"Working Hours", 
                    Description:"please select one of the below",
                    Items:{
                        "Morning": {
                            Cards : false,
                            Title:"Morning",
                            Description:"Sunday: 8:00 - 12:00<br/>Monday: 8:00 - 12:00<br/>Tuesday: 8:00 - 12:00<br/>Wednesday: 8:00 - 12:00<br/>Thursday: 8:00 - 12:00​​​"
                        },
                        "Evening": {
                            Cards : false,
                            Title:"Evening",
                            Description:"Sunday: 2:00 - 8:00<br/>Monday: 2:00 - 8:00<<br/>Tuesday: 2:00 - 8:00<<br/>Wednesday: 2:00 - 8:00<<br/>Thursday: 2:00 - 8:00​​​"
                        }
                    }    
                },
                "Available Properties":{
                    Cards : true,
                    Title:"Available Properties", 
                    Description:"please select one of the below",
                    Items:{
                        "Viva Bahryia Tower 29": {
                            Cards : true,
                            Image: "http://www.udcqatar.com/ContentFiles/74Image.jpg",
                            Title:"Viva Bahryia Tower 29",
                            Description:"Start Date: December 2007 Delivery Date: February 2010 Project Type: Residential ​​​​",
                            Pref: "Viva Bahriya precinct is of true beachfront condominium living, perfect for families and all who seek a more relaxed lifestyle. Architecturally themed to echo the very best of the Maghreb – with Moroccan-styled townhouses and apartments, Viva Bahriya is lapped by a warm, inviting sea and its own stretch of pristine beach, it is a haven for water sports enthusiasts. Offering tenants a vast range of options for a “greener” lifestyle, Viva Bahriya is strategically located within a lush and reserved neighborhood of the Pearl-Qatar.Various studios and 1 to 3 bedroom apartments and luxury penthouses are located in elegant tower residences. Townhouses and low rise blocks offer innovative design and features with Marina and beach views."
                        },  
                        "Qanat Quartier": {
                            Cards : true,
                            Image: "http://www.udcqatar.com/ContentFiles/73Image.jpg",
                            Title:"Qanat Quartier",
                            Description:"Start Date: March 2006 Delivery Date: June 2012 Project Type: Retail,Residential ​​​​",
                            Pref: "With its colorful Venetian character, Qanat Quartier is carefully planned around intricate canals and pedestrian-friendly squares and plazas. Each waterway is spanned by stylish bridges which further evoke the soul of Italian romantic living. Edged by sandy bays embracing the Arabian Gulf, Qanat Quartier is an intriguingly complex area in which a true Riviera lifestyle can be enjoyed. Proximity to water is a feature of all townhouses, with many enjoying direct views over the beach and some even featuring roof gardens.Boutique-style shopping adds to the intimate village feel and provides a heart for the community that thrives there. With a significant percentage of retail space signed, the district is anticipated to be extremely popular with its residents as well as visitors as it evolves into a unique retail locale."
                        },  
                        "The Pearl Towers": {
                            Cards : true,
                            Image: "http://www.udcqatar.com/ContentFiles/75Image.jpg",
                            Title:"Qanat Quartier",
                            Description:"Start Date: February 2013 Delivery Date: October 2016 Project Type: Commercial​​​​",
                            Pref: "Standing as the tallest architecture on the Pearl Island, the Pearl AQ-01 and AQ-02 towers are identical structures situated at the entrance of The Pearl-Qatar and developed primarily to accommodate high quality commercial office space, making it the location of choice for many discerning businesses. Within its cosmopolitan setting, The Pearl Towers' design language is fundamentally a modern-day interpretation of time-honored styles and themes, and each 42-storey tower offers amenities designed to provide the best possible working environment within first class facilities.As a high quality state-of-the-art commercial office development, the Pearl Towers are seen as a major step forward for the Island and a great enterprise aimed at clients looking for office space in an inspiring location. Standing at approximately 201 meters each on opposite sides, the two beacon-like office towers flank the main access road of the Pearl-Qatar, and serve as a defining feature to the whole Pearl development."
                        }
                    }   
                }
            },
            ar:{
                "المكان":{ 
                    Cards : false,
                    Title:"المكان", 
                    Description:"الرجاء الاختيار من الأماكن التالية",
                    Items:{
                        "راس أبو فنطاس": {
                            Cards : false,
                            Title:"الدفنة",
                            Description:"​​تبلغ مساحة رأس بوفنطاس حوالي 4 كيلو متر مربع، وتقع هذه المنطقة بالقرب من مطار حمد الدولي، وتمتاز بموقعها المثالي للأعمال التي تستدعي التواصل على مستوى دولي.<br/>تتميز رأس بوفنطاس بكل ما يجعلها مركزاً للتكنولوجيا والخدمات اللوجستية في المنطقة، والقدرة على جذب الأعمال الإقليمية والعالمية، والتبادل التجاري والاستثمارات التي ستحقق خ​طة حكومة دولة قطر في أن تصبح الدولة الذكية.<br/>يعزز استدامة الأعمال ومستوى الجودة الرفيع والكلفة المنخفضة للصيانة، وذلك كونها تحتوي على مراكز وخدمات،والمساحات العامة، ومباني العمال، وخدمات المرافق العامة، وتجهيزات المكاتب والمتاجر، والمقر الرئيسي الخاص بشركة 'مناطق'."
                        },
                        "أم الهلول": {
                            Cards : false, 
                            Title:"الغرافة",
                            Description:"​​تبلغ مساحة رأس بوفنطاس حوالي 4 كيلو متر مربع، وتقع هذه المنطقة بالقرب من مطار حمد الدولي، وتمتاز بموقعها المثالي للأعمال التي تستدعي التواصل على مستوى دولي.<br/>تتميز رأس بوفنطاس بكل ما يجعلها مركزاً للتكنولوجيا والخدمات اللوجستية في المنطقة، والقدرة على جذب الأعمال الإقليمية والعالمية، والتبادل التجاري والاستثمارات التي ستحقق خ​طة حكومة دولة قطر في أن تصبح الدولة الذكية.<br/>يعزز استدامة الأعمال ومستوى الجودة الرفيع والكلفة المنخفضة للصيانة، وذلك كونها تحتوي على مراكز وخدمات،والمساحات العامة، ومباني العمال، وخدمات المرافق العامة، وتجهيزات المكاتب والمتاجر، والمقر الرئيسي الخاص بشركة 'مناطق'."
                        }
                    }           
                },
                "مواعيد العمل":{
                    Cards : false,
                    Title:"مواعيد العمل", 
                    Description:"الرجاء ألإختيار من التالي",
                    Items:{
                        "صباحاً": {
                            Cards : false,
                            Title:"صباحاً",
                            Description:"الأحد : 8:00 - 12:00 <br/>الاثنين : 8:00 - 12:00 <br/>الثلاثاء : 8:00 - 12:00 <br/> الاربعاء : 8:00 - 12:00 <br/>الخميس : 8:00 - 12:00​​​"
                        },
                        "مساءً": {
                            Cards : false,
                            Title:"مساءً",
                            Description:"الأحد : 8:00 - 2:00 <br/>الاثنين : 8:00 - 2:00 <br/>الثلاثاء : 8:00 - 2:00 <br/> الاربعاء : 8:00 - 2:00 <br/>الخميس : 8:00 - 2:00"
                        }
                    }    
                },
                "الفريق الإداري":{
                    Cards : true,
                    Title:"الفريق الإداري", 
                    Description:"الرجاء ألإختيار من التالي",
                    Items:{
                        "فهد راشد الكعبي": {
                            Cards : true,
                            Image: "https://www.manateq.qa/Admin/PublishingImages/MTQICONS/Fahad%20Al%20Kaabi_Chief%20Executive%20Officer.JPG",
                            Title:"فهد راشد الكعبي",
                            Description:"​شغل الكعبي منصب الرئيس التنفيذي لشركة قطر للإدارة المشاريع (QPM) قبل إلتحاقه بشركة المناطق الاقتصادية. يتمتع الكعبي بخبرة واسعة، تصل إلى أكثر من 17 عاما لا سيما في مجال الهندسة، وإدارة المشاريع ، ومستويات الادارة العليا، حيث تقلد عدة مناصب هامة منها مدير ادارة مشاريع المياه ومدير ادارة كفاءة الطاقة بشركة كهرماء، حيث قام السيد الكعبي خلال هذه الفترة بوضع العديد من السياسات والاستراتيجيات المتعلقة بترشيد إستخدام الكهرباء والماء، كما عمل أيضا على زيادة الوعي بأهمية المحافظة على الطاقة في قطر وفق أعلى المعايير الإقليمية والدولية. حصل الكعبي على شهادة البكالوريوس في الهندسية الصناعية وشهادة البكالوريوس في إدارة الأعمال من جامعة ميامي بالولايات المتحدة الأمريكية، وحصل على درجة الماجستير في إدارة المشاريع من جامعة هيوستن عام 2007.يأمل الكعبي، ومن خلال موقعه كرئيس تنفيذي لشركة المناطق الإقتصادية، في أن يساهم في تحقيق رؤية الشركة التي تهدف إلى دعم التنوع والتنافسية والى تسهيل نمو قطاع الشركات والصناعات الصغيرة والمتوسطة في الإقتصاد القطري تماشيا مع رؤية قطر الوطنية 2030​​​"
                        },
                        "محمد العمادي": {
                            Cards : true,
                            Image: "https://www.manateq.qa/PublishingImages/Al%20Emadi%203.jpg",
                            Title:"محمد العمادي",
                            Description:"يشغل السيد محمد لطف الله العمادي منصب رئيس الشؤون الإدارية والمالية في شركة المناطق الاقتصادية ويدير حالياً أربعة أقسام مختلفة وهي قسم الموارد البشرية، وقسم الموارد المالية، وقسم تكنولوجيا المعلومات، وقسم الخدمات. ويتمتّع العمادي بخبرة ودراية واسعة بفضل الخبرات التي اكتسبها خلال العشرين عام الماضية من مجالات وقطاعات مختلفة مثل البنوك والخدمات اللوجستية والتطوير العقاري والإستثمار. فقبل التحاقه بشركة مناطق، شغل العمادي العديد من المناصب الهامة طيلة مسيرته المهنية في العديد من الشركات على غرار بنك التنمية الصناعية، وشركة الخليج للمخازن، وشركة بروة الدولية للإستثمار العقاري، وشركة أسباير كتارا للإستثمار.​يحمل السيد محمد العمادي بكالوريوس في الهندسة الصناعية من جامعة تكساس إيه اند إم في الولايات المتحده الأمريكيه، كما حصل على العديد من الشهادات من خلال الدورات التدريبية وورش العمل في مجال القياده والإدارة والمحاسبة المالية."
                        },
                        "محمد المالكي": {
                            Cards : true,
                            Image: "https://www.manateq.qa/Admin/PublishingImages/MTQICONS/Mohammed%20Al%20Malki.JPG",
                            Title:"محمد المالكي",
                            Description:"يشغل السيد محمد حسن المالكي منصب رئيس شؤون تطوير وتخطيط الأعمال في شركة المناطق الاقتصادية - مناطق منذ عام 2014. ويتمتّع محمد حسن بدراية واسعة في مجال التخطيط الاستراتيجي والتسويق وتنمية العلاقات وتطوير الأعمال بفضل الخبرات التي اكتسبها من مجالات مختلفة. فقبل انضمامه إلى فريق إدارة مناطق، شغل محمد حسن المالكي منصب رئيس قسم التخطيط الاستراتيجي بالمؤسسة العامة القطرية للكهرباء والماء  وتضمنت مهامه في الإشراف على رسم خارطة الطريق، وتشكيل منتدى التخطيط الاستراتيجي، بالإضافة إلى تحديد الأهداف القصيرة والطويلة المدى للمؤسسة. كما شملت خبرات المالكي السابقة أعمالاً في ميادين مختلفة على غرار تصميم ومراقبة الشبكة الهيدروليكية للمياه فضلاً عن إعداد خطة عمل الشبكة الموزّعة للمياه في .كما يجدر بالذكر أن محمد حسن المالكي يحمل درجة الماجستير في الإدارة من جامعة ليدز ودرجة البكالوريوس في علوم الهندسة الميكانيكية من جامعة قطر. بالإضافة إلى ذلك، التحق المالكي بالعديد من الدورات التدريبية وورشات العمل لتطوير قدراته في إدارة الأعمال والتخطيط الاستراتيجي لا سيما التطبيق العملي ‪'Balance Scorecard'‪ لتحقيق التميز في الأداء، وأيضاً أساليب القيادة لإدارة فعالة، وغيرها العديد من الدورات​​​​"
                        },
                        "حمد النعيمي": {
                            Cards : true,
                            Image: "https://www.manateq.qa/Admin/PublishingImages/MTQICONS/Hamad%20Al%20Naimi_Chief%20Operations%20officer.JPG",
                            Title:"حمد النعيمي",
                            Description:"يشغل السيد حمد راشد النعيمي منصب رئيس شؤون العمليات في شركة المناطق الاقتصادية - مناطق منذ عام 2015، حيث يتولّى مجموعة واسعة من المهام والمسؤوليات منها تطوير وتنفيذ السياسات الاستراتيجية للتشغيل والصيانة لشركة مناطق. وخلال مسيرته المهنية، تولّى النعيمي عدة مناصب هامة أكسبته خبرة ودراية واسعة في العديد من المجالات. فقبل أن يتولّى منصب الرئيس التنفيذي للعمليات، شغل النعيمي العديد من المناصب منها مدير مشروع منطقة الكرعانة الاقتصادية، كما تولّى منصب مدير مراقبة المشاريع والعقود حيث كان يشرف على تنفيذ وتطويّر آليات دعم المشاريع والمشتريات التابعة لها.قبل انضمامه إلى فريق إدارة شركة المناطق الاقتصادية، شغل النعيمي منصب مدير عام الهندسة والانشاءات لدى شركة المتحدة للتنمية، حيث تولى قيادة مجموعة من المشاريع الضخمة من التصميم الى التسليم النهائي كما تم تعيينه عضو مجلس ادارة احدى الشركات التابعه لها، كما تولّى منصب الرئيس الفني لشركة راس غاز، حيث كان يشغل مهمة إدارة المصالح المشتركة مع شركة قطر للغاز والعديد من الشركات التابعة لشركة قطر للبترول. كما كان مسؤولاً عن العديد من المشاريع الضخمة في كل من شركة راس غاز وهيئة الأشغال العامة، حيث تولّى إدارة وتنفيذ مشاريع البنية التحتية. السيد حمد النعيمي حاصل على بكالوريوس في الهندسة المدنية ، كما يملك اكثر من خمسة عشر عاما من الخبره العمليه والادارية وقد تميز بتمتّعه بمهارات قيادية فذة. فهو عضوٌ نشط في معهد إدارة المشاريع الخاصة، والجمعية الأمريكية لإدارة المشاريع - القسم العربي. كما التحق النعيمي بالعديد من الدورات التدريبية والبرامج التأهيلية لتطوير قدراته في إدارة الأعمال والريادة في المشاريع على غرار البرنامج العالمي'الرئيس التنفيذي المستقبلي' في قطر، وبرنامج القيادات التنفيذية من مركز قطر للقيادات."
                        },
                        "حمد المري": {
                            Cards : true,
                            Image: "https://www.manateq.qa/Admin/PublishingImages/MTQICONS/Hamad%20Al%20Marri_Chief%20Projects%20Officer.JPG",
                            Title:"حمد المري",
                            Description:"​انضم المهندس حمد جارالله المري لشركة المناطق الاقتصادية - مناطق بصفته رئيساً لشؤون المشاريع، ويتولّى مجموعة واسعة من المسؤوليات منها تطوير وقيادة المخطّطات الاستراتيجية، ورسم خارطة الطريق الفنية للمشاريع، والتنسيق مع فريق تطوير الأعمال لتنفيذ استراتيجية الشركة، ومراقبة مراحل تشييد وتطوير المشاريع. كما يجدر بالذكر أن المري، وقبل التحاقه بمناطق، بدأ مسيرته المهنية عام 1997 حيث عمل بشركة سنمبروجيتي في ميلان، ومن ثم انتقل إلى العمل في شركة هيونداي في العاصمة سيول، كما عمل بشركة بكتل الأمريكية، ومنها إلى شركة قطر للبترول وصولاً إلى الالتحاق بشركة مناطق عام ٢٠١٣ بعد تجربة مهنية عالمية المستوى.​يحمل المهندس المري البكالوريوس في الهندسة الميكانيكية، وأكثر من ثلاثين شهادةً في العديد من الدورات التدريبية والبرامج التأهيلية والقيادية. التحق المري بالعديد من اللجان أثناء مسيرته المهنية مثل لجنة المناقصات لشركة ميرسك قطر للبترول ومشروع البتروكيماويات التابع لقطر للبترول وشال وشل، وشركة دولفين للطاقة وشركة توتال قطر، فضلاً عن عمله كنائب لرئيس الفريق القائم على أعمال الغاز الطبيعي المضغوط لفائدة النقل العمومي. المهندس/ حمد المري شارك في العديد من المؤتمرات والمناسبات داخل وخارج دولة قطر.​​​"
                        }
                    }   
                }
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
        bot.dialog("CollectInformation",[
            function(session,args){
                // session.send(JSON.stringify(args));
                // session.dialogData.property = args;
                session.send('%s',session.conversationData.InterestedProperty)
                session.beginDialog("getname");    
            },
            function(session,results){ //get email
                session.dialogData.name =  session.conversationData.name;
                session.beginDialog("getEmail");
            },
            function(session,results){ //get mobile
                session.dialogData.email = results.response;
                session.beginDialog("getMobile");
            },
            // function(session,results){ //get zone
            //     session.dialogData.mobile = results.response;
            //     var zones = program.Helpers.GetOptions(program.Options.Zones,session.preferredLocale());
            //     builder.Prompts.choice(session, "getZones", zones,{listStyle: builder.ListStyle.button});
            // },
            // function(session,results){ //get sector
            //     session.dialogData.zone = results.response.entity;
            //     var sectors = program.Helpers.GetOptions(program.Options.Sectors,session.preferredLocale());
            //     builder.Prompts.choice(session, "getSectors", sectors,{listStyle: builder.ListStyle.button});
            // },
            // function(session,results){ //get operation
            //     session.dialogData.sector = results.response.entity;
            //     var operations = program.Helpers.GetOptions(program.Options.Operations,session.preferredLocale());
            //     //نوع العمل الذي ترغب بتأسيسة
            //     builder.Prompts.choice(session, "getOperations", operations,{listStyle: builder.ListStyle.button});
            // },
            function(session,results){ //get how you heard about us
                session.dialogData.mobile = results.response;
                builder.Prompts.text(session, "getHowYouHeard");
            },
            function(session,results){ //get comment
                session.dialogData.heard = results.response;
                builder.Prompts.text(session, "addComment");
            },
            function(session,results){ // end
                session.dialogData.comment = results.response;
                session.send(session.dialogData.name);
                //Send Email
                program.Helpers.SendEmail({
                    email:session.dialogData.email,
                    user:session.dialogData.name,
                    mobile:session.dialogData.mobile,
                    property:session.conversationData.InterestedProperty,
                    // sector:session.dialogData.sector,
                    // operation:session.dialogData.operation,
                    heard:session.dialogData.heard,
                    comment:session.dialogData.comment
                },session.preferredLocale());
                session.send("thanksInquiry",session.dialogData.email);
                session.conversationData.applicationSubmitted = true;

                var lead = {
                    subject: "Intersted in "+ session.conversationData.InterestedProperty,
                    firstname: session.dialogData.name,
                    // lastname: session.conversationData.lastName,
                    mobilephone: session.dialogData.mobile,
                    emailaddress1: session.dialogData.email
                };
                //call dynamicsWebApi.create function 
                dynamicsWebApi.create(lead, "leads").then(function (id) {
                    session.send("Your data had been saved");
                }).catch(function (error) {
                    //session.send("Item Not Added");
                })
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
        bot.dialog("getFirstname",[
            function(session){ //get fisrt name
                if(session.conversationData.firstName == null){
                    builder.Prompts.text(session,"firstOnlyNamePlease");
                }
                else{
                    session.endDialog();
                }
            },
            function(session,results){ 
                session.conversationData.firstName = results.response;
                session.endDialog();
            }
        ]);
        bot.dialog("getLastname",[
            function(session){ //get last name
                if(session.conversationData.lastName == null){
                    builder.Prompts.text(session,"LastOnlyNamePlease");
                }
                else{
                    session.endDialog();
                }
            },
            function(session,results){ 
                session.conversationData.lastName = results.response;
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
        bot.dialog("getEmailCRM",[
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
                    {
                        dynamicsWebApi.retrieveAll("contacts", ["emailaddress1","firstname"], "statecode eq 0").then(function (response) {
                            var records = response.value;
                            // session.send(JSON.stringify(response.value));
                            // session.send('%s' , JSON.stringify(records).toLowerCase().indexOf(results.response.toLowerCase()))
                            if(JSON.stringify(records).toLowerCase().indexOf(results.response.toLowerCase()) > 0 )
                            {
                                for (var i = 0; i < records.length; i++) {
                                    var element = records[i];
                                    if (element.emailaddress1 != null && element.emailaddress1.toLowerCase() == results.response.toLowerCase()) {
                                        session.CRMResult = true;
                                        session.conversationData.firstName = element.firstname;
                                        break;
                                    }
                                }
                                session.endDialogWithResult(results);
                            }
                            else
                            {
                                session.dialogData.email = results.response;
                                session.beginDialog("CollectDataCRM",{Email:results.response}); 
                            }
                        })
                        .catch(function (error){
                            session.send(JSON.stringify( error));
                        });

                        /*if("CRM" == "CRM")
                            session.endDialogWithResult(results);
                        else
                        {
                            session.dialogData.email = results.response;
                            session.beginDialog("CollectDataCRM"); 
                        }*/
                    }
                else
                    session.replaceDialog('getEmail', { reprompt: true });
            }
        ]);
        bot.dialog("CollectDataCRM",[
            function(session,args){
                session.dialogData.email = args.Email;
                session.beginDialog("getFirstname");    
            },
            function(session,results){ //get fisrt name
                session.dialogData.firstName = results.response;
                session.beginDialog("getLastname");
            },
            function(session,results){ //get last name
                session.dialogData.lastName = results.response;
                session.beginDialog("getMobile");
            },
            function(session,results){ //get how you heard about us
                session.dialogData.mobile = results.response;
                dynamicsWebApi.retrieveAll("leads", ["emailaddress1"], "statecode eq 0").then(function (response) {
                    var records = response.value;
                    // session.send(JSON.stringify(records).toLowerCase().indexOf(session.dialogData.email.toLowerCase()));
                    if(JSON.stringify(records).toLowerCase().indexOf(session.dialogData.email.toLowerCase()) < 0 )
                    {
                        var lead = {
                                subject: "Not Registered Resident Chatbot Record",
                                firstname: session.conversationData.firstName,
                                lastname: session.conversationData.lastName,
                                mobilephone: session.dialogData.mobile,
                                emailaddress1: session.dialogData.email
                            };
                            //call dynamicsWebApi.create function 
                            dynamicsWebApi.create(lead, "leads").then(function (id) {
                                session.send("Item Added");
                            }).catch(function (error) {
                                session.send("Item Not Added");
                            })

                        session.endDialogWithResult(results);
                    }
                    else
                        session.endDialogWithResult(results);
                })
                .catch(function (error){
                    session.send("");
                });
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
        bot.dialog("Services",[
            function(session){
                var ServicesList = program.Helpers.GetOptions(program.Options.Services,session.preferredLocale());
                builder.Prompts.choice(session, "getServices", ServicesList,{listStyle: builder.ListStyle.button});
            },
            function(session,results){

            }
        ]);
        
        //////////////////////////

    bot.dialog("PropertyOptions",[
            function(session){
                var locale = session.preferredLocale();
                var result = program.Options.AvailableProperty[locale]["Available Properties"];
                session.dialogData.item = result;
                if(!result.Cards)
                {
                    builder.Prompts.choice(session, result.Description, result.Items,{listStyle: builder.ListStyle.button});
                }
                else{
                    var msg = new builder.Message(session);
                    msg.attachmentLayout(builder.AttachmentLayout.carousel);
                    var attachments = [];
                    var txt = session.localizer.gettext(session.preferredLocale(),"select");
                    for(var i in result.Items)
                    {
                        attachments.push(
                             new builder.HeroCard(session)
                            .title(result.Items[i].Title)
                            .text(result.Items[i].Description.substring(0,250)+"...")
                            .images([builder.CardImage.create(session, result.Items[i].Image)])
                            .buttons([
                                builder.CardAction.imBack(session, result.Items[i].Title, txt)
                            ])
                        );
                    }
                    msg.attachments(attachments);
                    //session.send(msg);
                    builder.Prompts.choice(session, msg, result.Items,{listStyle: builder.ListStyle.button});
                }
            },
            function(session,results){
                var item = session.dialogData.item.Items[results.response.entity];
                if(item.Cards)
                {
                    var msg = new builder.Message(session);
                    var PropertyInterests = program.Helpers.GetOptions(program.Options.PropertyInterest,session.preferredLocale());
                    session.conversationData.InterestedProperty = item.Title;
                    // session.send(JSON.stringify(PropertyInterests))
                    msg.attachmentLayout(builder.AttachmentLayout.carousel);
                    msg.attachments([
                        new builder.HeroCard(session)
                        .title(item.Title)
                        .text(item.Pref)
                        .images([builder.CardImage.create(session, item.Image)])
                        .buttons([
                            builder.CardAction.imBack(session,Object.keys(PropertyInterests)[0], Object.keys(PropertyInterests)[0]),
                            builder.CardAction.imBack(session,Object.keys(PropertyInterests)[1],Object.keys(PropertyInterests)[1]),
                            builder.CardAction.imBack(session, Object.keys(PropertyInterests)[2],Object.keys(PropertyInterests)[2])
                        ])
                    ])

                    // session.send(msg);//.endDialog();
                    builder.Prompts.choice(session, msg, PropertyInterests, {listStyle: builder.ListStyle.button});
                }
                else{
                   session.send(item.Title + "\n\n" +  item.Description);
                   session.endDialog();     
                }
            },
             function(session,results){
                if(results.response.index == 0)
                    session.replaceDialog("CollectInformation");//, { Property: results.response.entity }); 
                else if(results.response.index == 1)
                {
                    session.send("welcomeText");
                    var UserTypes = program.Helpers.GetOptions(program.Options.UserType,session.preferredLocale());
                    builder.Prompts.choice(session, "getUserType", UserTypes,{listStyle: builder.ListStyle.button});
                }
                else if(results.response.index == 2)
                    session.replaceDialog("PropertyOptions"); 
                //   session.send(JSON.stringify(results));
             }
        ]);

        /////////////////////////

        bot.dialog("setLanguageWithPic",[
            function(session){
                var msg = new builder.Message(session);
                msg.attachmentLayout(builder.AttachmentLayout.carousel);
                var txt = session.localizer.gettext("en","selectYourLanguage");
                msg.attachments([
                new builder.HeroCard(session)
                    .title("UDC")
                    .text(txt)
                    .images([builder.CardImage.create(session, "http://www.udcqatar.com/images/logo.png")])
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
                        // session.send("1");
                    
                    
                    /*//call any function 
                    dynamicsWebApi.executeUnboundFunction("WhoAmI").then(function (response) {
                        session.send('Hello Dynamics 365! My id is: ' + response.UserId);
                    }).catch(function(error){
                        session.send(error.message);
                    });
                    var leadId = 'bc90202c-097d-e711-80ed-3863bb346b18';
                    //perform a retrieve operaion 
                    dynamicsWebApi.retrieve(leadId, "leads", ["fullname", "subject"]).then(function (record) {
                        session.send(JSON.stringify(record));
                        //do something with a record here 
                    })
                    .catch(function (error) {
                        //catch an error 
                    });*/
                  
                        /*dynamicsWebApi.retrieveAll("leads", ["emailaddress1","firstname" ], "statecode eq 0").then(function (response) {
                            var records = response.value;
                            for (var i = 0; i < records.length; i++) {
                                var element = records[i];
                                if (element.emailaddress1.toLowerCase() == "moatazattar@gmail.com") {
                                    session.send("%s", element.firstname);
                                    break;
                                }
                            }
                        })
                        .catch(function (error){
                            session.send("");
                        });*/

                        session.send("welcomeText");
                        var UserTypes = program.Helpers.GetOptions(program.Options.UserType,session.preferredLocale());
                        builder.Prompts.choice(session, "getUserType", UserTypes,{listStyle: builder.ListStyle.button});
                    //   session.endDialog();
                   }
               }
            );  
            },
            function (session,results) {
                session.conversationData.userType = results.response.entity;
                if(results.response.index == 1)
                {
                    session.conversationData.IsResident = true;
                    var AlreadyUserOptions = program.Helpers.GetOptions(program.Options.AlreadyUser,session.preferredLocale());
                    builder.Prompts.choice(session, "areYouMemeber", AlreadyUserOptions,{listStyle: builder.ListStyle.button});
                    // session.send("whichService");
                    // session.replaceDialog("Services");
                }
                else
                {
                    session.replaceDialog("PropertyOptions"); 
                }
            },
               function (session,results) {
                session.beginDialog("getEmailCRM");
            },
            function (session,results) {
                // session.send(JSON.stringify(results));
                if(session.CRMResult)
                    session.send("Hi Mr. "+ session.conversationData.firstName);
                session.send("whichService");
                session.replaceDialog("Services");
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
            html = html.replace("{{property}}",data.property);
            // html = html.replace("{{sector}}",data.sector);
            // html = html.replace("{{operation}}",data.operation);
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


bot.on('conversationUpdate', function (activity) {  
    if (activity.membersAdded) {
        activity.membersAdded.forEach((identity) => {
            if (identity.id === activity.address.bot.id) {
                   bot.beginDialog(activity.address, 'setLanguageWithPic');
             }
         });
    }
 });


// // Receive messages from the user and respond by echoing each message back (prefixed with 'You said:')
// var bot = new builder.UniversalBot(connector, function (session) {
//     session.send("You saids: %s", session.message.text);

// });