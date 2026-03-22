'use server';

import { APPOINTMENT_TABLE_ID, DATABASE_ID, databases, PATIENT_TABLE_ID } from "../appwrite.config";
import { ID, Query } from "node-appwrite";
import { parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";


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

export const getRecentAppointmentList = async () => {
    try {
        const appointments = await databases.listDocuments(
            DATABASE_ID!,
            APPOINTMENT_TABLE_ID!,
            [Query.orderDesc('$createdAt')],
        );   

        const populatedAppointments = await Promise.all(
            appointments.documents.map(async (appointment) => {
                const patient = await databases.getDocument(
                DATABASE_ID!,
                PATIENT_TABLE_ID!,
                appointment.patient // This is the string ID from your console log
            );

            return {
                ...appointment,
                patient: patient, // Now 'patient' is the full object with a .name property
                };
            })
        );

        const initialCounts = {
            scheduledCount: 0,
            pendingCount: 0,
            cancelledCount: 0,
        }

        const counts = (appointments.documents as Appointment[]).reduce((acc, appointment) => {
            if(appointment.status === "scheduled") {
                acc.scheduledCount += 1;
            } else if(appointment.status === "pending") {
                acc.pendingCount += 1;
            } else if(appointment.status === "cancelled") {
                acc.cancelledCount += 1;
            }
            return acc;
        }, initialCounts);

        const data = {
            totalCount: appointments.total,
            ...counts,
            documents: populatedAppointments,
        }

        return parseStringify(data);

    } catch (error) {
        console.log(error);

    }
}

export const updateAppointment = async ({ appointmentId, appointment, type, userId }: UpdateAppointmentParams) => {
    try {
        const updatedAppointment = await databases.updateDocument(
            DATABASE_ID!,
            APPOINTMENT_TABLE_ID!,
            appointmentId,
            appointment,
        );

        if (!updatedAppointment) {
            throw new Error("Failed to update appointment");
        }

        //TODO SMS Notification

        revalidatePath('/admin');
        return parseStringify(updatedAppointment);
    } catch (error) {
        console.log(error);
    }
}