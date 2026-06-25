const DEVICE_ID_KEY = 'vwf_device_id';

export function getDeviceId() {
    try {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = `dev-${crypto.randomUUID()}`;
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    } catch {
        return 'dev-anonymous';
    }
}
