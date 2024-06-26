#include "WLListener.hpp"
#include "MiscFunctions.hpp"
#include <string>
#include "../debug/Log.hpp"
#include "Watchdog.hpp"

void handleWrapped(wl_listener* listener, void* data) {
    CHyprWLListener::SWrapper* pWrap = wl_container_of(listener, pWrap, m_sListener);

    if (g_pWatchdog)
        g_pWatchdog->startWatching();

    try {
        pWrap->m_pSelf->emit(data);
    } catch (std::exception& e) { Debug::log(ERR, "Listener {} threw or timed out and was killed by Watchdog!!! This is bad. what(): {}", (uintptr_t)listener, e.what()); }

    if (g_pWatchdog)
        g_pWatchdog->endWatching();
}

CHyprWLListener::CHyprWLListener(wl_signal* pSignal, std::function<void(void*, void*)> const& callback, void* pOwner) {
    initCallback(pSignal, callback, pOwner);
}

CHyprWLListener::CHyprWLListener() {
    m_swWrapper.m_pSelf            = this;
    m_swWrapper.m_sListener.notify = &handleWrapped;
    wl_list_init(&m_swWrapper.m_sListener.link);
}

CHyprWLListener::~CHyprWLListener() {
    removeCallback();
}

void CHyprWLListener::removeCallback() {
    if (isConnected()) {
        Debug::log(LOG, "Callback {:x} -> {:x}, {} removed.", (uintptr_t)&m_pCallback, (uintptr_t)&m_pOwner, m_szAuthor);
        wl_list_remove(&m_swWrapper.m_sListener.link);
        wl_list_init(&m_swWrapper.m_sListener.link);
    }
}

bool CHyprWLListener::isConnected() {
    return !wl_list_empty(&m_swWrapper.m_sListener.link);
}

void CHyprWLListener::initCallback(wl_signal* pSignal, std::function<void(void*, void*)> const& callback, void* pOwner, std::string author) {
    if (isConnected()) {
        Debug::log(ERR, "Tried to connect a listener twice?!");
        return;
    }

    m_pOwner    = pOwner;
    m_pCallback = callback;
    m_szAuthor  = author;

    addWLSignal(pSignal, &m_swWrapper.m_sListener, pOwner, m_szAuthor);
}

void CHyprWLListener::emit(void* data) {
    m_pCallback(m_pOwner, data);
}
