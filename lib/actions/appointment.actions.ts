'use server';

import { APPOINTMENT_TABLE_ID, DATABASE_ID, databases, messaging, PATIENT_TABLE_ID, users } from "../appwrite.config";
import { ID, Query } from "node-appwrite";
import { formatDateTime, parseStringify } from "../utils";
import { Appointment } from "@/types/appwrite.types";
import { revalidatePath } from "next/cache";
import { Resend } from "resend";
import { email } from "zod";


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

const emailNotification = async ({ appointment, type, email }: { appointment: any, type: string, email: string }) => {
    const resend = new Resend(process.env.RESEND_API_KEY!);

    try {
        await resend.emails.send({
            from: 'onboarding@resend.dev', // Ensure this domain is verified in Resend
            to: email, // MUST be an email address, not a userId
            subject: `CarePulse: Appointment ${type === "schedule" ? "Confirmed" : "Cancelled"}`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Greetings from CarePulse!</h2>
                    <p>Your appointment is <strong>${type === "schedule" ? "confirmed" : "cancelled"}</strong>.</p>
                    <p>${type === "schedule" 
                        ? `Date: ${formatDateTime(appointment.schedule!).dateTime} with <strong>Dr. ${appointment.primaryPhysician}</strong>`
                        : `Reason: ${appointment.cancellationReason}`}
                    </p>
                </div>`
        });
    } catch (error) {
        console.error("Resend Error:", error);
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

        const smsMessage = `Greetings from CarePulse. ${type === "schedule" ? 
            `Your appointment is confirmed for ${formatDateTime(appointment.schedule!).dateTime} with Dr. ${appointment.primaryPhysician}` 
            : `We regret to inform that your appointment for ${formatDateTime(appointment.schedule!).dateTime} is cancelled. Reason:  ${appointment.cancellationReason}`}.`;
            
        await sendSMSNotification(userId, smsMessage);

        const user = await users.get(userId); 
        const userEmail = user.email;

        await emailNotification({ appointment, type, email: userEmail });

        

        const emailMessage = `${type === "schedule" ?

            `Your appointment is confirmed for ${formatDateTime(appointment.schedule!).dateTime} with Dr. ${appointment.primaryPhysician}`

            : `We regret to inform that your appointment for ${formatDateTime(appointment.schedule!).dateTime} is cancelled. Reason:  ${appointment.cancellationReason}`}.`

        await sendEmailNotification(userId, "CarePulse Appointment Update", emailMessage);

        revalidatePath('/admin');
        return parseStringify(updatedAppointment);
    } catch (error) {
        console.log(error);
    }
}

//  SEND SMS NOTIFICATION
export const sendSMSNotification = async (userId: string, content: string) => {
  try {
    // https://appwrite.io/docs/references/1.5.x/server-nodejs/messaging#createSms
    const message = await messaging.createSms(
      ID.unique(),
      content,
      [],
      [userId]
    );
    return parseStringify(message);
  } catch (error) {
    console.error("An error occurred while sending sms:", error);
  }
};

// Send Email Notification
export const sendEmailNotification = async (userId: string, subject: string, content: string) => {
  try {
    const message = await messaging.createEmail(
      ID.unique(),
      subject,
      content,
      [], // Topics (empty)
      [userId] // Target User IDs
    );
    return parseStringify(message);
  } catch (error) {
    console.error("Appwrite Messaging Error:", error);
  }
};