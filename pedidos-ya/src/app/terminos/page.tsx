import Link from "next/link"
import { ArrowLeft, FileText, CheckCircle2 } from "lucide-react"

export default function DocumentosLegalesPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-6 sm:py-20 sm:px-10 lg:px-16">
            <div className="w-full max-w-5xl bg-white shadow-2xl sm:rounded-[2.5rem] rounded-3xl overflow-hidden border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-red-600 via-red-700 to-red-900 px-8 py-10 sm:px-20 md:px-24 sm:py-16 text-white relative">
                    <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                        <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
                    <div className="flex justify-center mb-6 mt-4">
                        <div className="bg-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                            <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-center tracking-tight mb-3">Términos y Condiciones</h1>
                    <p className="text-center text-red-100 text-sm sm:text-base font-medium">Última actualización: Marzo 2026</p>
                </div>

                {/* Content */}
                <div className="px-10 py-12 sm:px-20 md:px-24 sm:py-16 text-gray-700 space-y-12 sm:space-y-14 text-sm sm:text-base leading-relaxed break-words">
                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">1.</span> Introducción
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                Bienvenido a PídeloYa. Estos Términos y Condiciones ("Términos") regulan el acceso y uso de la plataforma virtual ("Plataforma") compuesta por la aplicación móvil y el sitio web de PídeloYa.
                                Al acceder, registrarse o usar nuestra plataforma, aceptas estar sujeto a estos Términos, que establecen una relación contractual entre tú y PídeloYa.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">2.</span> Naturaleza del Servicio
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                PídeloYa es una plataforma tecnológica que actúa como intermediario para facilitar la conexión entre Usuarios (que desean pedir comida o productos), Restaurantes/Comercios (que ofrecen dichos productos) y Repartidores Independientes ("Drivers"). PídeloYa no prepara, empaca, ni vende los alimentos, ni presta servicios de logística de manera directa; somos estrictamente un proveedor de tecnología.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">3.</span> Registro de Cuenta de Usuario
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Para usar la mayoría de las funciones, debes registrarte y mantener una cuenta de usuario personal.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Debes ser mayor de edad en tu jurisdicción (generalmente 18 años).</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Aceptas proporcionar información exacta, completa y actualizada. El no hacerlo puede resultar en la inhabilitación de tu cuenta.</span>
                                </li>
                                <li className="flex gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Eres responsable de toda actividad que ocurra bajo tu cuenta y de mantener la seguridad y confidencialidad de tu nombre de usuario y contraseña.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">4.</span> Pedidos y Entregas
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Responsabilidad del comercio:</strong> El Restaurante es el único responsable por la calidad, cantidad, idoneidad y estado de los productos preparados, así como del cumplimiento de normativas sanitarias.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Tiempo de entrega:</strong> Los tiempos dados en la aplicación son estrictamente estimaciones basadas en distancia y volumen. PídeloYa no garantiza un tiempo de entrega exacto.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Disponibilidad:</strong> Los pedidos están sujetos a la disponibilidad del comercio y de los repartidores independientes conectados en ese momento.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">5.</span> Pagos y Precios
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                Los precios mostrados en la aplicación son establecidos por los Comercios. Nos reservamos el derecho de cobrar una "Tarifa de Servicio" y una "Tarifa de Envío" (si aplica). Todos los cargos son exigibles inmediatamente y el pago se facilitará mediante los métodos habilitados en la plataforma. PídeloYa se reserva el derecho de modificar sus precios y tarifas en zonas de alta demanda (tarifas dinámicas).
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">6.</span> Cancelaciones y Reembolsos
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100 space-y-4">
                                <p className="text-gray-600">
                                    Puedes cancelar tu pedido sin cargo únicamente antes de que el restaurante comience a prepararlo. Si cancelas posteriormente, PídeloYa y/o el Restaurante se reservan el derecho a cobrar el importe total del pedido en concepto de compensación por los bienes perecederos y el esfuerzo invertido.
                                </p>
                                <p className="text-gray-600 font-medium">
                                    Cualquier reclamo sobre la calidad del pedido debe hacerse dentro de las 24 horas siguientes a la entrega, a través de nuestro centro de soporte en la plataforma.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">7.</span> Usos Prohibidos
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600 mb-4">No podrás realizar ninguna de las siguientes acciones:</p>
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600">Infringir leyes locales o nacionales al usar nuestra plataforma.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600">Usar la plataforma con propósitos fraudulentos (ej. uso de tarjetas de crédito robadas).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600">Faltar al respeto, agredir verbal o físicamente o discriminar a cualquier empleado de PídeloYa, Repartidor Independiente o personal del Restaurante.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600">Extraer datos, hackear o interferir en la red y operatividad de PídeloYa.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-red-600">8.</span> Limitación de Responsabilidad
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                PídeloYa proporciona los servicios "tal cual" y "según disponibilidad". No garantizamos que los servicios sean ininterrumpidos o libres de errores. PídeloYa no será responsable por daños indirectos, incidentales, o punitivos derivados del uso de la plataforma o de la calidad de alimentos entregados.
                            </p>
                        </div>
                    </section>

                    <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-gray-400">© 2026 PídeloYa.</p>
                        <Link
                            href="/"
                            className="bg-red-50 px-6 py-2.5 rounded-full text-red-600 hover:bg-red-100 hover:text-red-700 font-bold text-sm transition-colors border border-red-100"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
