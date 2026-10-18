/** Self-contained so the generated opaque-frame bridge uses this exact implementation. */
export function createWorkshopPayloadTransfer(options) {
    // Even JSON's six-character control escapes stay below the 256-KB envelope.
    const chunkChars = 32 * 1024;
    const maximumTransfers = options.maximumTransfers ?? 8;
    const timeoutMs = options.timeoutMs ?? 10_000;
    const schedule = typeof setTimeout === 'function' ? setTimeout : null;
    const cancelTimer = typeof clearTimeout === 'function' ? clearTimeout : null;
    const outgoing = new Map();
    // Include the synchronous serialization phase in admission, not just ACK waits.
    const admitted = new Map();
    const incoming = new Map();
    let sequence = 0;
    const prefix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const envelope = { channel: 'echo:workshop-plugin', version: 1 };
    const supportedType = (type) => ['request', 'response', 'event',
        'invoke-command', 'invoke-agent', 'invoke-source-provider', 'invoke-lyrics-provider', 'invoke-metadata-provider', 'invoke-cover-provider',
        'command-result', 'agent-result', 'source-provider-result', 'lyrics-provider-result', 'metadata-provider-result', 'cover-provider-result'].includes(type);
    // A saturated data transfer must still admit small controls (including cancel).
    // This conservative, bounded walk avoids serializing rejected large graphs.
    const isSmallEnvelope = (value) => {
        let remaining = chunkChars;
        const parents = new Set();
        const visit = (input, depth) => {
            if (remaining < 0 || depth > 16)
                return false;
            if (typeof input === 'string') {
                remaining -= input.length * 6 + 2;
                return remaining >= 0;
            }
            if (input === null || typeof input === 'boolean' || typeof input === 'number') {
                remaining -= 24;
                return remaining >= 0;
            }
            if (!input || typeof input !== 'object' || parents.has(input)
                || typeof input.toJSON === 'function')
                return false;
            parents.add(input);
            remaining -= 2;
            for (const key in input) {
                if (!Object.prototype.hasOwnProperty.call(input, key))
                    continue;
                remaining -= key.length * 6 + 4;
                if (!visit(input[key], depth + 1))
                    return false;
            }
            parents.delete(input);
            return remaining >= 0;
        };
        return visit(value, 0);
    };
    const drop = (id) => {
        const record = incoming.get(id);
        if (record?.timer)
            cancelTimer?.(record.timer);
        if (record)
            record.parts.length = 0;
        incoming.delete(id);
    };
    const send = async (target, value) => {
        const message = value;
        if (!message || !supportedType(String(message.type))) {
            options.post(target, value);
            return;
        }
        if (admitted.size >= maximumTransfers) {
            if (isSmallEnvelope(message)) {
                options.post(target, value);
                return;
            }
            throw new Error('workshop-payload-concurrency');
        }
        const id = `${prefix}-${++sequence}`;
        admitted.set(id, target);
        let serialized = '';
        try {
            serialized = JSON.stringify(message);
            if (serialized.length <= chunkChars) {
                options.post(target, value);
                return;
            }
            const header = { type: String(message.type),
                ...(typeof message.requestId === 'string' ? { requestId: message.requestId } : {}),
                ...(typeof message.invocationId === 'string' ? { invocationId: message.invocationId } : {}) };
            if (message.type === 'request')
                header.action = String(message.action);
            for (let offset = 0, index = 0; offset < serialized.length; offset += chunkChars, index++) {
                if (!admitted.has(id) || (index > 0 && !outgoing.has(id)))
                    throw new Error('workshop-payload-cancelled');
                await new Promise((resolve, reject) => {
                    let timer = null;
                    const finish = (ok) => {
                        if (timer)
                            cancelTimer?.(timer);
                        if (ok)
                            resolve();
                        else {
                            outgoing.delete(id);
                            reject(new Error('workshop-payload-cancelled'));
                        }
                    };
                    outgoing.set(id, { target, index, finish });
                    timer = schedule?.(() => finish(false), timeoutMs) ?? null;
                    try {
                        options.post(target, { ...envelope, type: 'payload-chunk', transferId: id, header, index,
                            final: offset + chunkChars >= serialized.length, data: serialized.slice(offset, offset + chunkChars) });
                    }
                    catch {
                        finish(false);
                    }
                });
            }
        }
        finally {
            outgoing.delete(id);
            admitted.delete(id);
            serialized = '';
        }
    };
    const receive = (target, value) => {
        if (!value || typeof value !== 'object')
            return { handled: false };
        const chunk = value;
        if (chunk.channel !== envelope.channel || chunk.version !== envelope.version
            || !['payload-chunk', 'payload-ack'].includes(String(chunk.type)))
            return { handled: false };
        const id = typeof chunk.transferId === 'string' && chunk.transferId.length <= 160 ? chunk.transferId : '';
        if (!id)
            return { handled: true };
        if (chunk.type === 'payload-ack') {
            const record = outgoing.get(id);
            if (record?.target === target && record.index === chunk.index)
                record.finish(chunk.ok === true);
            return { handled: true };
        }
        const ack = (ok) => options.post(target, { ...envelope, type: 'payload-ack', transferId: id, index: chunk.index, ok });
        if (incoming.has(id) && incoming.get(id)?.target !== target) {
            ack(false);
            return { handled: true };
        }
        const header = chunk.header;
        if (!header || typeof header !== 'object' || !supportedType(header.type)
            || [header.requestId, header.invocationId].some(item => item !== undefined && (typeof item !== 'string' || item.length > 160))
            || !Number.isSafeInteger(chunk.index) || Number(chunk.index) < 0
            || typeof chunk.data !== 'string' || chunk.data.length > chunkChars || typeof chunk.final !== 'boolean'
            || !options.accept(target, header)) {
            drop(id);
            ack(false);
            return { handled: true };
        }
        let record = incoming.get(id);
        if (!record) {
            if (chunk.index !== 0 || incoming.size >= maximumTransfers) {
                ack(false);
                return { handled: true };
            }
            record = { target, header, index: 0, parts: [], timer: schedule?.(() => drop(id), timeoutMs) ?? null };
            incoming.set(id, record);
        }
        if (record.target !== target || record.index !== chunk.index || JSON.stringify(record.header) !== JSON.stringify(header)) {
            drop(id);
            ack(false);
            return { handled: true };
        }
        record.parts.push(chunk.data);
        record.index += 1;
        if (!chunk.final) {
            ack(true);
            return { handled: true };
        }
        try {
            const serialized = record.parts.join('');
            // Release the chunk inventory before allocating the parsed graph.
            record.parts.length = 0;
            const message = JSON.parse(serialized);
            if (!message || message.channel !== envelope.channel || message.version !== envelope.version
                || message.type !== header.type || message.requestId !== header.requestId || message.invocationId !== header.invocationId
                || (header.type === 'request' && message.action !== header.action))
                throw new Error();
            drop(id);
            ack(true);
            return { handled: true, message };
        }
        catch {
            drop(id);
            ack(false);
            return { handled: true };
        }
    };
    const disposeTarget = (target) => {
        for (const [id, record] of incoming)
            if (!target || record.target === target)
                drop(id);
        for (const record of [...outgoing.values()])
            if (!target || record.target === target)
                record.finish(false);
        for (const [id, owner] of admitted)
            if (!target || owner === target)
                admitted.delete(id);
    };
    return { send, receive, disposeTarget, pending: () => ({ incoming: incoming.size, outgoing: outgoing.size }) };
}
