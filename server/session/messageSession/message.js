export const messages = [];

export const messageSet = (PhoneNumber, message) => {
  const messageData = {
    PhoneNumber: PhoneNumber,
    message: message,
    time: Date.now(),
  };

  messages.push(messageData);
};

export const messageGet = (PhoneNumber) => {
  return messages.find((messageData) => {
    return messageData.PhoneNumber === PhoneNumber;
  });
};

export const messageDelete = (PhoneNumber) => {
  const index = messages.findIndex((messageData) => {
    return messageData.PhoneNumber === PhoneNumber;
  });

  if (index !== -1) messages.splice(index, 1);
};
