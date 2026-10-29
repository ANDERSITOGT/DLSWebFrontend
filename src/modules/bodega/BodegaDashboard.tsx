import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "../../components/ui/card";
import { bodegaNavigation } from "../../config/navigation";

export function BodegaDashboard() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Panel de Bodega Central
        </h1>
        <p className="mt-1 text-slate-600">
          Accede rápidamente a las principales funciones de la bodega.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bodegaNavigation
          .filter(({ to }) => to !== "/")
          .map(({ label, description, to, icon: Icon }) => (
            <Link key={to} to={to} className="group">
              <Card className="h-full transition-colors group-hover:border-sky-300 group-hover:bg-sky-50">
                <CardContent className="flex h-full items-start gap-4 p-5">
                  <div className="rounded-xl bg-sky-100 p-3 text-sky-700">
                    <Icon size={22} />
                  </div>
                  <div>
                    <CardTitle className="text-base">Ir a {label}</CardTitle>
                    <CardDescription className="mt-1">
                      {description}
                    </CardDescription>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
      </div>
    </section>
  );
}
