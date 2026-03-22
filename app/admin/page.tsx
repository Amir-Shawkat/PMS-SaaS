import Image from "next/image";
import Link from "next/link";
import { StatCard } from "@/components/StatCard";
import { DataTable } from "@/components/table/DataTable";
import { columns, Payment } from "@/components/table/columns";
import { getRecentAppointmentList } from "@/lib/actions/appointment.actions";

async function getData(): Promise<Payment[]> {
  // Fetch data from your API here.
  return [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ]
}


const Admin = async () => {

  const data = await getData();

  const appointments = await getRecentAppointmentList();

  return (
    <div className="mx-auto flex max-w-7xl flex-col space-y-14">
      <header className="admin-header">
        <Link href="/">
          <Image
            src="/assets/icons/logo-full.svg"
            alt="back"
            width={162}
            height={32}
            className="cursor-pointer h-8 w-fit"
          />
        </Link>

        <p className="text-16-semi-bold">Admin Dashboard</p>
      </header>

      <main className="admin-main">
        <section className="w-full space-y-4">
          <h1 className="header">Welcome 👋🏼</h1>  
          <p className="text-dark-700">Start the date with managing new appointments</p>
        </section> 

        <section className="admin-stat">
            <StatCard
              type="appointments"
              count={appointments?.scheduledCount || 0}
              label="Scheduled Appointments"
              icon="/assets/icons/appointments.svg"
            />

            <StatCard
              type="pending"
              count={appointments?.pendingCount || 0}
              label="Pending Appointments"
              icon="/assets/icons/pending.svg"
            />

            <StatCard
              type="cancelled"
              count={appointments?.cancelledCount || 0}
              label="Cancelled Appointments"
              icon="/assets/icons/cancelled.svg"
            />
        </section> 

        <DataTable columns={columns} data={appointments?.documents || []} /> 
        {/* <DataTable columns={columns} data={data} /> */}
      </main>
    </div>
  );
}   

export default Admin;