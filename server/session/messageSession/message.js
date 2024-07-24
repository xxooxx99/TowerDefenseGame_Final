export const messages = new Map();

export const messageSet = (PhoneNumber, message) => {
  const messageData = {
    message: message,
    time: Date.now(),
  };

  messages.set(PhoneNumber, messageData);
};

export const messageGet = (PhoneNumber) => {
  return messages.get(PhoneNumber);
};

export const messageDelete = (PhoneNumber) => {
  messages.delete(PhoneNumber);
};
