import Link from "next/link"
import { ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function PrivacidadPage() {
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12 px-6 sm:py-20 sm:px-10 lg:px-16">
            <div className="w-full max-w-5xl bg-white shadow-2xl sm:rounded-[2.5rem] rounded-3xl overflow-hidden border border-gray-200 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900 px-8 py-10 sm:px-20 md:px-24 sm:py-16 text-white relative">
                    <Link href="/" className="absolute top-6 left-6 sm:top-8 sm:left-8 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm">
                        <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Link>
                    <div className="flex justify-center mb-6 mt-4">
                        <div className="bg-white/10 p-4 sm:p-5 rounded-2xl backdrop-blur-md shadow-inner border border-white/20">
                            <ShieldCheck className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-center tracking-tight mb-3">Política de Privacidad</h1>
                    <p className="text-center text-teal-100 text-sm sm:text-base font-medium">Última actualización: Marzo 2026</p>
                </div>

                {/* Content */}
                <div className="px-10 py-12 sm:px-20 md:px-24 sm:py-16 text-gray-700 space-y-12 sm:space-y-14 text-sm sm:text-base leading-relaxed break-words">
                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">1.</span> Introducción
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                En PídeloYa respetamos tu privacidad y valoramos la confianza que depositas en nosotros al usarnos para encargar tus pedidos, gestionar tu restaurante o repartir. Esta Política explica qué datos recopilamos, por qué los recopilamos y cómo puedes acceder y actualizar esa información.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">2.</span> Información que Recopilamos
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600"><strong>Datos directos:</strong> Nombre, correo electrónico, número de teléfono, contraseña, información de métodos de pago (aunque no almacenamos los dígitos enteros de tus tarjetas de crédito) e historial de soporte o reclamos.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600"><strong>Datos generados:</strong> Direcciones de entrega guardadas, historial de pedidos realizados en Restaurantes, monto pagado, tipos de comida favoritos, uso y preferencias de bonos.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600"><strong>Dispositivo y GPS:</strong> Modelo de dispositivo, sistema operativo, IP y, si nos otorgas permiso explícito, rastreo de tu ubicación en segundo plano o mientras la app está abierta para estimar tiempos de entrega o facilitar al Repartidor encontrarte.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">3.</span> Uso de Tu Información
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <div className="bg-gray-50 p-4 sm:p-6 rounded-2xl border border-gray-100 mb-4">
                                <p className="text-gray-600 mb-3 font-medium">Usamos tus datos principalmente para:</p>
                                <ul className="space-y-3">
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Facilitar y enviar los pedidos de productos a tu domicilio.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Calcular, cobrar y pagar servicios (incluidas tarifas dinámicas).</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Optimizar la exactitud de nuestras predicciones de tiempos de entrega.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Comunicaciones transaccionales: Enviarte recibos, actualizaciones del estado del pedido, mensajes del Restaurante o Repartidor (como SMS, Notificaciones Push y Correo).</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Garantizar la seguridad de cuentas, así como detectar y prevenir fraudes.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                        <span className="text-gray-600">Con propósitos de Marketing y Publicidad: Ofrecer promociones (pudiendo cancelar tu suscripción a estos mensajes en cualquier momento).</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">4.</span> Intercambio de Información
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600 font-medium mb-3">No vendemos tu información personal. No obstante, compartimos datos con:</p>
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Restaurantes:</strong> Reciben tu nombre, los ítems solicitados y comentarios u observaciones de entrega.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Repartidores (Drivers):</strong> Tu dirección y nombre para la entrega y una vía de contacto para solventar inconvenientes (enmascarada para proteger privacidad mutua).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Proveedores de Servicios:</strong> Procesadores de pagos, servicios en la nube (ej., AWS) y servicios de analíticas (ej., Google Analytics).</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <div className="h-2 w-2 rounded-full bg-teal-500 mt-2 shrink-0"></div>
                                    <span className="text-gray-600"><strong>Autoridades Gubernamentales:</strong> Si la legislación así lo demanda o por el bien de la integridad física de nuestra comunidad de usuarios y comercios.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">5.</span> Retención de Datos
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600">
                                Mantenemos la información de los usuarios activos y su historial por el tiempo necesario para proveer la plataforma y resolver disputas legales, auditorías y cumplimiento fiscal. Si un usuario opta por eliminar su cuenta voluntariamente, PídeloYa restringirá sus datos eliminándolos activamente o volviéndolos anónimos salvo que sean requeridos temporalmente por estamentos legales.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-lg sm:text-2xl font-black text-gray-900 mb-4 pb-2 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-teal-600">6.</span> Tus Derechos
                        </h2>
                        <div className="pl-3 sm:pl-8">
                            <p className="text-gray-600 mb-3">
                                De acuerdo con las leyes jurisdiccionales de Protección de Datos (como la Ley de Identidad Digital de Chile, o regulaciones regionales equivalentes), tienes plenos derechos para:
                            </p>
                            <ul className="space-y-4">
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Acceder o solicitar copias de toda la data que asociamos a tu persona.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Requerir la corrección de perfiles o informaciones erradas.</span>
                                </li>
                                <li className="flex gap-3 items-start">
                                    <CheckCircle2 className="h-5 w-5 text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-gray-600">Solicitar el borrado de datos o limitar su uso publicitario desde los ajustes de la app.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    <div className="mt-8 pt-6 sm:pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-gray-400">© 2026 PídeloYa.</p>
                        <Link
                            href="/"
                            className="bg-teal-50 px-6 py-2.5 rounded-full text-teal-600 hover:bg-teal-100 hover:text-teal-700 font-bold text-sm transition-colors border border-teal-100"
                        >
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
