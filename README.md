# Mastra Travel App

Aplicación de planificación de viajes que ayuda a los usuarios a crear itinerarios personalizados integrando pronósticos del clima, eventos locales, atracciones turísticas, hoteles, recomendaciones de restaurantes y distancias entre los distintos puntos de interés.

## Características

- **Integración del Clima**: Obtén pronósticos meteorológicos precisos para tu destino
- **Descubrimiento de Eventos**: Encuentra eventos y actividades locales durante tu estadía
- **Recomendaciones de Atracciones**: Descubre puntos turísticos populares y lugares de interés
- **Recomendaciones de Hoteles**: Encuentra alojamientos disponibles según tus preferencias
- **Sugerencias de Restaurantes**: Obtén recomendaciones de los mejores lugares para comer
- **Itinerario con IA**: Genera planes de viaje personalizados con tiempos exactos entre puntos
- **Exportación a PDF**: Descarga tu itinerario en PDF con formato atractivo


## INSTALACIÓN Y USO

### Prerrequisitos

- Node.js (se recomienda la última versión LTS)
- npm o yarn

### Pasos

1. Clona el repositorio:

```bash
git clone https://github.com/PedrooJ/mastra-travel-app
cd mastra-travel-app
```

2. Instala las dependencias:

```bash
npm install
```

3. Introduce tu OPENAI KEY:
   
Abre .env.development y sustituye "key" por tu key   

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

5. Entra a http://localhost:4111/

6. Entra a Workflows -> travel-workflow

7. El itinerario se descargara como PDF en \mastra-travel-app\src\pdf\

## Estructura

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
    - Generación de itinerario con un agente que combina chatgpt con una tool que obtiene las rutas entre dos puntos (routeTool), el agente utiliza esta tool únicamente con los puntos que escoge para el itinerario, de modo que pueda dar el tiempo exacto que tardas en ir de un punto a otro.
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

- Para que sea más comodo de probar he subido el .env.development con mis claves de las apis necesarias excepto la de OpenAI (La única que es de pago).
Solo se necesita cambiar "key" por tu propia key para que funcione todo.

- El step de las atracciones turísticas tarda un poco por las limitaciones de solicitudes que tiene la api de TripAdvisor.
Tengo que hacer una solicitud por cada una de las atracciones obtenidas para obtener su latitud y longitud, para que luego el agente pueda utilizar estos datos con routeTool, y esto relentiza la app.

## ERRORES

No ha habido tiempo de depurar todos los errores. Algunos de los que he detectado son:
- No funcionan itinerarios de un solo día porque la api de los hoteles no puede buscar hoteles sin ni una noche.
- Con itinerarios de más de 4 días puede ser que chatgpt decida dar solo el itinerario del primer o los dos primeros días.
- Los días tienen que estar en las siguientes 2 semanas (aprox) para que la api del tiempo no falle.
  







