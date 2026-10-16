#pragma once

#include <cstddef>
#include <cstdint>
#include <limits>
#include <type_traits>

#if defined(__BYTE_ORDER__) && __BYTE_ORDER__ != __ORDER_LITTLE_ENDIAN__
#error "The audio plugin PCM preview ABI requires a little-endian platform"
#endif

// Experimental native ABI. No C++ atomic objects, pointers, packed fields or
// platform handles cross the mapping. State access requires platform atomics.
namespace echo::audio_plugin {

inline constexpr std::uint32_t pcmMagic = 0x45504131; // EPA1
inline constexpr std::uint32_t pcmVersion = 1;
inline constexpr std::uint32_t slotCount = 4;
inline constexpr std::uint32_t maximumFrames = 512;
inline constexpr std::uint32_t maximumChannels = 8;
inline constexpr std::uint32_t maximumSamples = maximumFrames * maximumChannels;
inline constexpr std::uint32_t playingFlag = 1;

enum class SlotState : std::uint32_t {
    Free = 0, DryReady = 1, Processing = 2, WetReady = 3,
    HostWriting = 4, HostReading = 5,
};

struct alignas(64) PcmHeader {
    std::uint32_t magic;
    std::uint32_t version;
    std::uint32_t regionBytes;
    std::uint32_t slots;
    std::uint32_t sampleRate;
    std::uint32_t channels;
    std::uint32_t maxFrames;
    std::uint32_t reserved[9];
};

struct alignas(64) PcmSlotHeader {
    std::uint32_t state;
    std::uint32_t cancelled;
    std::uint64_t generation;
    std::uint64_t sequence;
    std::int64_t projectTimeSamples;
    std::uint32_t frames;
    std::uint32_t flags;
    std::uint32_t reserved[6];
};

struct alignas(64) PcmSlot {
    PcmSlotHeader header;
    float dry[maximumSamples];
    float wet[maximumSamples];
};

struct alignas(64) PcmRegion {
    PcmHeader header;
    PcmSlot slots[slotCount];
};

static_assert(sizeof(float) == 4);
static_assert(std::numeric_limits<float>::is_iec559);
static_assert(sizeof(PcmHeader) == 64);
static_assert(sizeof(PcmSlotHeader) == 64);
static_assert(offsetof(PcmSlot, dry) == 64);
static_assert(offsetof(PcmSlot, wet) == 16448);
static_assert(sizeof(PcmSlot) == 32832);
static_assert(sizeof(PcmRegion) == 131392);
static_assert(std::is_standard_layout_v<PcmRegion>);
static_assert(std::is_trivially_copyable_v<PcmRegion>);

} // namespace echo::audio_plugin
