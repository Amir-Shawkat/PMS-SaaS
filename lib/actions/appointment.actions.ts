'use server';

import { APPOINTMENT_TABLE_ID, DATABASE_ID, databases } from "../appwrite.config";
import { ID } from "node-appwrite";
import { parseStringify } from "../utils";


export const createAppointment = async (appointment: CreateAppointmentParams) => {
    try {
        const newAppointment = await databases.createDocument(
        DATABASE_ID!,
        APPOINTMENT_TABLE_ID!,
        ID.unique(),
        appointment,
    );

    return parseStringify(newAppointment);
    } catch (error) {
        console.log(error);
    }
}


export const getAppointment = async (appointmentId: string) => {
    try {
        const appointment = await databases.getDocument(
            DATABASE_ID!,
            APPOINTMENT_TABLE_ID!,
            appointmentId,
        );

        return parseStringify(appointment);
    } catch (error) {
        console.log(error);
    }
}