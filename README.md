# Mastra Travel App

Aplicación de planificación de viajes que ayuda a los usuarios a crear itinerarios personalizados integrando pronósticos del clima, eventos locales, atracciones turísticas, hoteles, recomendaciones de restaurantes y distancias entre puntos.

## Características

- **Integración del Clima**: Obtén pronósticos meteorológicos precisos para tu destino
- **Descubrimiento de Eventos**: Encuentra eventos y actividades locales durante tu estadía
- **Recomendaciones de Atracciones**: Descubre puntos turísticos populares y lugares de interés
- **Recomendaciones de Hoteles**: Encuentra alojamientos disponibles según tus preferencias
- **Sugerencias de Restaurantes**: Obtén recomendaciones de los mejores lugares para comer
- **Itinerario con IA**: Genera planes de viaje personalizados usando un agente que combina chatgpt con una tool de rutas (routeTool) que puede usar para descubrir la distancia entre dos puntos usando las latitudes y longitudes que incluyen.
- **Exportación a PDF**: Crea itinerarios en PDF con formato atractivo


## Comenzando

### Prerrequisitos

- Node.js (se recomienda la última versión LTS)
- npm o yarn

### Instalación

1. Clona el repositorio:

```bash
git clone [url-del-repositorio]
cd mastra-travel-app
```

2. Instala las dependencias:

```bash
npm install
```

3. Introduce tu OPENAI KEY:
   
Abre .env/development y sustituye "key" por tu key   

5. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Uso

La aplicación proporciona un sistema basado en flujos de trabajo para crear planes de viaje. Así es como funciona:

1. **Parámetros de Entrada**:
    - Ciudad
    - Fecha de Inicio (YYYY-MM-DD)
    - Fecha de Fin (YYYY-MM-DD)
    - Número de Adultos
    - Precio (Texto que procesará un llm, puedes especificar un precio general, el del hotel, restaurantes, etc. Ej: Quiero gastar alrededor de 600 euros pero ir a los restaurantes más baratos)

2. **Pasos del Flujo de Trabajo**:
    - Obtención del pronóstico del clima
    - Descubrimiento de eventos
    - Recomendaciones de restaurantes
    - Recomendaciones de hoteles
    - Sugerencias de atracciones turísticas
    - Generación de itinerario con un agente que combina chatgpt con una tool que obtiene las rutas entre dos puntos
    - Exportación a PDF

## Estructura del Proyecto

```
src/
├── mastra/
│   ├── agents/         # Agentes de IA para diferentes tareas
│   ├── workflows/      # Definiciones de flujos de trabajo
│   ├── tools/          # Funciones de utilidad e integraciones con APIs
│   └── schemas/        # Esquemas de validación de datos
├── pdf/                # Archivos PDF generados
└── fonts/              # Fuentes personalizadas para la generación de PDF
```

## Integración con APIs

La aplicación se integra con varias APIs externas:
- Open-Meteo API (Clima)
- Ticketmaster API (Eventos)
- TripAdvisor API (Atracciones)
- Booking.com API (Hoteles)
- Google Places API (Restaurantes)
- Openrouteservice API (Ruta entre 2 puntos)
- OpenAI (Redactar el itinerario)


## IMPORTANTE

- Para que sea más comodo de probar he subido el ./env/development con mis claves de las apis anteriores excepto la de OpenAI (La única que es de pago de las usadas).
Solo se necesita cambiar "key" por tu propia key para que funcione todo.

- La aplicación de momento solo funciona con itinerarios de 2 o 3 días. Si pones más días chatgpt solo escribirá los 2 primeros días de itinerario (quizá porque la respuesta de chatgpt sería muy larga de otro modo?). Y con 1 solo día no se usaría la api de hoteles.
- El step de las atracciones turísticas tarda un poco por las limitaciones de solicitudes que tiene la api de TripAdvisor.
Tengo que hacer una solicitud por cada una de las atracciones obtenidas para obtener su latitud y longitud, para que luego el agente pueda utilizar estos datos con routeTool.






