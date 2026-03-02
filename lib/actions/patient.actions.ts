'use server';

import { ID, Query } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';

import {
  BUCKET_ID,
  DATABASE_ID,
  ENDPOINT,
  PATIENT_COLLECTION_ID,
  PROJECT_ID,
  databases,
  storage,
  users,
} from '../appwrite.config';
import { parseStringify } from '../utils';

// CREATE APPWRITE USER
export const createUser = async (user: CreateUserParams) => {
  try {
    const newUser = await users.create(
      ID.unique(),
      user.email,
      user.phone,
      undefined,
      user.name,
    );

    return parseStringify(newUser);
  } catch (error: any) {
    // Handle existing user
    if (error?.code === 409) {
      const existingUser = await users.list([
        Query.equal('email', [user.email]),
      ]);
      return existingUser.users[0] || null;
    }
    console.error('An error occurred while creating a new user:', error);
    return null;
  }
};

// GET USER
export const getUser = async (userId: string) => {
  try {
    const user = await users.get(userId);
    return parseStringify(user);
  } catch (error) {
    console.error(
      'An error occurred while retrieving the user details:',
      error,
    );
    return null;
  }
};

// REGISTER PATIENT
export const registerPatient = async ({
  identificationDocument,
  ...patient
}: RegisterUserParams) => {
  try {
    let file = null;

    if (identificationDocument) {
      const blob = identificationDocument.get('blobFile') as Blob;
      const fileName = identificationDocument.get('fileName') as string;

      // Convert Blob to Uint8Array
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      const inputFile = InputFile.fromBuffer(uint8Array, fileName);

      file = await storage.createFile(BUCKET_ID!, ID.unique(), inputFile);
    }

    const newPatient = await databases.createDocument(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      ID.unique(),
      {
        identificationDocumentId: file?.$id || null,
        identificationDocumentUrl: file?.$id
          ? `${ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`
          : null,
        ...patient,
      },
    );

    return parseStringify(newPatient);
  } catch (error) {
    console.error('An error occurred while creating a new patient:', error);
    return null;
  }
};

// GET PATIENT
export const getPatient = async (userId: string) => {
  try {
    const patients = await databases.listDocuments(
      DATABASE_ID!,
      PATIENT_COLLECTION_ID!,
      [Query.equal('userId', [userId])],
    );

    if (!patients.documents.length) return null;

    return parseStringify(patients.documents[0]);
  } catch (error) {
    console.error(
      'An error occurred while retrieving the patient details:',
      error,
    );
    return null;
  }
};
