interface SMSTemplate {
  body: string;
  type: string;
}

export const smsTemplates: Record<string, SMSTemplate> = {
  test: {
    type: 'test',
    body: 'This is a test SMS notification from your app.'
  },
  periodStart: {
    type: 'period_start',
    body: 'Your period is starting soon. Remember to track your symptoms in the app!'
  },
  periodEnd: {
    type: 'period_end',
    body: 'Your period has ended. Don\'t forget to update your cycle in the app!'
  },
  reminder: {
    type: 'reminder',
    body: 'Reminder: Your next period is expected to start in 3 days. Prepare accordingly!'
  },
  symptomAlert: {
    type: 'symptom_alert',
    body: 'You reported severe symptoms. Consider consulting a healthcare provider if symptoms persist.'
  }
};

export const getSMSTemplate = (type: string, customData?: Record<string, string>): string => {
  const template = smsTemplates[type];
  if (!template) {
    throw new Error(`SMS template not found for type: ${type}`);
  }

  let message = template.body;
  if (customData) {
    // Replace placeholders in the template with custom data
    Object.entries(customData).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, value);
    });
  }

  return message;
}; 