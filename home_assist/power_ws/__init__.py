import logging
import json
from aiohttp import web
from homeassistant.components.http import HomeAssistantView
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers import device_registry as dr
from .const import DOMAIN, WS_ENDPOINT

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up from a config entry."""
    hass.data.setdefault(DOMAIN, {"connections": {}, "devices": {}})

    # Register the WebSocket endpoint
    hass.http.register_view(PowerWSView(hass))

    # Forward setup to platforms
    await hass.config_entries.async_forward_entry_setups(entry, ["switch"])
    return True


class PowerWSView(HomeAssistantView):
    """View to handle incoming WebSocket connections from devices."""

    url = WS_ENDPOINT
    name = "api:power_ws:controller"
    requires_auth = False  # Set to True if devices support HA headers

    def __init__(self, hass: HomeAssistant):
        self.hass = hass

    async def get(self, request):
        """Handle WebSocket handshake."""
        ws = web.WebSocketResponse(heartbeat=30)
        await ws.prepare(request)

        mac = request.query.get("mac")
        if not mac:
            _LOGGER.error("Device connected without MAC address")
            await ws.close()
            return ws

        mac = dr.format_mac(mac)
        _LOGGER.info("Device %s connected", mac)

        # Store connection
        self.hass.data[DOMAIN]["connections"][mac] = ws

        # Notify platforms that a device is active (triggers entity creation if needed)
        self.hass.bus.async_fire(f"{DOMAIN}_device_connected", {"mac": mac})

        try:
            async for msg in ws:
                if msg.type == web.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    # Update sensor data in HA
                    self.hass.bus.async_fire(f"{DOMAIN}_data_{mac}", data)
                elif msg.type == web.WSMsgType.ERROR:
                    _LOGGER.error(
                        "WS connection closed with exception %s", ws.exception()
                    )
        finally:
            _LOGGER.info("Device %s disconnected", mac)
            self.hass.data[DOMAIN]["connections"].pop(mac, None)
            self.hass.bus.async_fire(f"{DOMAIN}_device_disconnected_{mac}")

        return ws
