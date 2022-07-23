const { initializeApp } = require('firebase/app');
const { getDownloadURL, getStorage, ref, uploadBytes } = require('firebase/storage');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyCbkMeTzrGKTvXsapoozv4w1nFZ3NO4igE",
  authDomain: "chat-app-99a7d.firebaseapp.com",
  projectId: "chat-app-99a7d",
  storageBucket: "chat-app-99a7d.appspot.com",
  messagingSenderId: "546425543691",
  appId: "1:546425543691:web:48cbf17703681b2ae57b0e"
};

const app = initializeApp(firebaseConfig);

const storage = getStorage(app);

const downloadURLPicture = async (path, name) => await getDownloadURL(ref(storage, `${path}/${name}.png`));
const uploadPicture = async (buffer, path, name) => await uploadBytes(ref(storage, `${path}/${name}.png`), buffer);
const getFile = (name) => {
  const buffer = fs.readFileSync(`${__dirname}/${name}.png`);
  return buffer;
}

const getURLAvatar = async usrId => await downloadURLPicture('avatars', usrId);
const getURLCoverPicture = async usrId => await downloadURLPicture('cover-pictures', usrId);
const uploadDefaultAvatar = async usrId => await uploadPicture(getFile('avatar-default'), 'avatars', usrId);
const uploadDefaultCoverPicture = async usrId => await uploadPicture(getFile('cover-picture-default'), 'cover-pictures', usrId);

module.exports = {
  getURLCoverPicture, getURLAvatar, uploadDefaultCoverPicture, uploadDefaultAvatar
}
