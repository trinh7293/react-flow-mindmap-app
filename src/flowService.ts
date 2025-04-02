import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { FlowData, HandleDataFromServer, UserDoc } from "./App/types";

export const getUserRef = (userId: string) => {
  const docRef = doc(db, "users", userId);
  return docRef;
};

export const getUserFlowDataServer = async (
  userId: string,
  callback: HandleDataFromServer
) => {
  const userRef = getUserRef(userId);
  const docSnap = await getDoc(userRef);
  if (docSnap.exists()) {
    const userData = docSnap.data() as UserDoc;
    console.log("Document data:", userData);
    callback(userData.flowData);
  } else {
    // docSnap.data() will be undefined in this case
    console.log("No such document!");
  }
};

export const setUserFlowDataServer = async (
  userId: string,
  flowData: FlowData
) => {
  const userRef = getUserRef(userId);
  await setDoc(userRef, { flowData });
};
