@component('mail::message')
    # Yeni Ziyaretçi Bildirimi

    Sayın {{ $visitor->user->name }},

    Aşağıdaki ziyaretçi sizi bekliyor:

    **Ad Soyad:** {{ $visitor->first_name }} {{ $visitor->last_name }}
    **Şirket:** {{ $visitor->company ?? 'Belirtilmemiş' }}
    **Giriş Zamanı:** {{ $visitor->check_in->format('d.m.Y H:i') }}

    @if($visitor->notes)
        **Not:**
        {{ $visitor->notes }}
    @endif

    Saygılarımızla,
    {{ config('app.name') }}
@endcomponent
