// ASK SDK
const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const skillData = require('./skillData');
// const util = require('./util');

/////////////////////////////////
// Handlers Definition
/////////////////////////////////

/**
 * Handles LaunchRequest requests sent by Alexa
 * Note : this type of request is send when the user invokes your skill without providing a specific intent.
 */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const data = skillData[handlerInput.requestEnvelope.request.locale];
    const speakOutput = data.WELCOME_MSG + " " + data.WELCOME_REPROMPT_MSG;
    const prompt = data.WELCOME_REPROMPT_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(prompt)
      .getResponse();
  }
};

const DialogueIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'DialogueIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent');
  },
  async handle(handlerInput) {

    const data = skillData[handlerInput.requestEnvelope.request.locale];

    // get session attributes
    let sessionData = handlerInput.attributesManager.getSessionAttributes() || {};

    // get persistent data
    let persisData = await handlerInput.attributesManager.getPersistentAttributes() || {};

    // initialize score if it is undefined or null
    persisData.userScore = persisData.userScore ? persisData.userScore : 0;

    // set persistent data
    handlerInput.attributesManager.setPersistentAttributes(persisData);
    // save persistent data
    await handlerInput.attributesManager.savePersistentAttributes();


    // get dialogue randomly 
    let dataToSave = data.quiz[Math.floor((Math.random()) * 2)];

    // save session attributes
    handlerInput.attributesManager.setSessionAttributes(dataToSave);

    const speakOutput = data.DIALOGUE_MSG + " " + dataToSave.dialogue;
    const prompt = dataToSave.dialogue;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(prompt)
      .getResponse();
  }
};

const AnswerIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AnswerIntent';
  },
  async handle(handlerInput) {

    const data = skillData[handlerInput.requestEnvelope.request.locale];
    const userAnswer = handlerInput.requestEnvelope.request.intent.slots.answer.value;

    // get sessionData
    const sessionData = handlerInput.attributesManager.getSessionAttributes();

    // get persistent data
    const persisData = await handlerInput.attributesManager.getPersistentAttributes() || {};

    console.log("**** HERE 1 ****", JSON.stringify(persisData));

    const correctAnswer = sessionData.movie;
    let speakOutput = '';

    if (correctAnswer.toUpperCase() === userAnswer.toUpperCase()) {

      speakOutput = data.CORRECT_ANSWER_MSG;
      persisData.userScore += (persisData.userScore !== undefined) ? 10 : 0;

    } else {
      speakOutput = data.WRONG_ANSWER_MSG;
      persisData.userScore -= (persisData.userScore !== undefined) ? 5 : 0;
    }

    console.log("**** HERE 2 ****", JSON.stringify(persisData));
    // set persistent data
    handlerInput.attributesManager.setPersistentAttributes(persisData);
    // save persistent data
    await handlerInput.attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const RepeatIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.RepeatIntent';
  },
  handle(handlerInput) {

    const sessionData = handlerInput.attributesManager.getSessionAttributes();

    let speakOutput = 'Ok. Here it is.' + " " + sessionData.dialogue;
    let prompt = sessionData.dialogue;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(prompt)
      .getResponse();
  }
};

/**
 * Handles AMAZON.HelpIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to AMAZON.HelpIntent intent defined in your intent schema.
 */
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const data = skillData[handlerInput.requestEnvelope.request.locale];
    const speakOutput = data.HELP_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

/**
 * Handles AMAZON.CancelIntent & AMAZON.StopIntent requests sent by Alexa 
 * Note : this request is sent when the user makes a request that corresponds to AMAZON.CancelIntent & AMAZON.StopIntent intents defined in your intent schema.
 */
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = "Goodbye!";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

/* *
 * The intent reflector is used for interaction model testing and debugging.
 * It will simply repeat the intent the user said. You can create custom handlers for your intents 
 * by defining them above, then also adding them to the request handler chain below 
 * */
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

/**
 * Generic error handling to capture any syntax or routing errors. If you receive an error
 * stating the request handler chain is not found, you have not implemented a handler for
 * the intent being invoked or included it in the skill builder below 
 * */
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.message}`);
    const data = skillData[handlerInput.requestEnvelope.request.locale];
    const speakOutput = data.ERROR_MSG;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

/////////////////////////////////
// Interceptors Definition
/////////////////////////////////

/**
 * This request interceptor will log all incoming requests in the associated Logs (CloudWatch) of the AWS Lambda functions
 */
const LoggingRequestInterceptor = {
  process(handlerInput) {
    console.log("\n" + "********** REQUEST *********\n" +
      JSON.stringify(handlerInput, null, 4));
  }
};

/**
 * This response interceptor will log outgoing responses if any in the associated Logs (CloudWatch) of the AWS Lambda functions
 */
const LoggingResponseInterceptor = {
  process(handlerInput, response) {
    if (response) console.log("\n" + "************* RESPONSE **************\n"
      + JSON.stringify(response, null, 4));
  }
};

/////////////////////////////////
// SkillBuilder Definition
/////////////////////////////////

/**
 * The SkillBuilder acts as the entry point for your skill, routing all request and response
 * payloads to the handlers above. Make sure any new handlers or interceptors you've
 * defined are included below. The order matters - they're processed top to bottom.
 */
exports.handler = Alexa.SkillBuilders.custom()
  .withPersistenceAdapter(
    new persistenceAdapter.S3PersistenceAdapter({ bucketName: process.env.S3_PERSISTENCE_BUCKET })
  )
  .addRequestHandlers(
    LaunchRequestHandler,
    DialogueIntentHandler,
    AnswerIntentHandler,
    RepeatIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
    IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
  .addErrorHandlers(
    ErrorHandler)
  .addRequestInterceptors(
    LoggingRequestInterceptor
  )
  .addResponseInterceptors(
    LoggingResponseInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();