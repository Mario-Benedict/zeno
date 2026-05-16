<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>LLM Chat - Zeno</title>
  @vite(['resources/css/app.css'])
  <style>
    /* Hide scrollbar for Chrome, Safari and Opera */
    .no-scrollbar::-webkit-scrollbar {
        display: none;
    }
    /* Hide scrollbar for IE, Edge and Firefox */
    .no-scrollbar {
        -ms-overflow-style: none;  /* IE and Edge */
        scrollbar-width: none;  /* Firefox */
    }
  </style>
</head>
<body class="bg-[#1a1a1a] text-gray-200 h-screen w-screen flex overflow-hidden font-sans antialiased text-sm">

  <!-- SIDEBAR (KIRI) -->
  <div class="w-64 bg-[#111] flex flex-col p-4 border-r border-[#2a2a2a] flex-shrink-0">
      <a href="{{ route('chat.index') }}" class="block w-full">
          <button class="w-full bg-[#2a2a2a] hover:bg-[#333] transition-colors text-gray-300 py-2.5 px-4 rounded-xl mb-6 text-sm text-left flex items-center shadow-sm">
             <span class="mr-2 opacity-70">+</span> New Chat
          </button>
      </a>

      <div class="text-xs font-semibold text-gray-500 mb-3 px-2">Chats</div>

      <div class="flex flex-col gap-1 overflow-y-auto no-scrollbar pb-4">
          @foreach ($sessions as $session)
            @php
              // Cek apakah ini sesi yang sedang aktif
              $isActive = isset($llm_chat_session_id) && $session->llm_chat_session_id == $llm_chat_session_id;
            @endphp
            <a href="{{ route('chat.switch', $session->llm_chat_session_id) }}" class="block">
              <button class="w-full text-left truncate px-3 py-2.5 rounded-lg transition-colors {{ $isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:bg-[#222]' }}">
                {{ $session->llm_chat_session_name }}
              </button>
            </a>
          @endforeach
      </div>
  </div>

  <!-- KONTEN CHAT (KANAN) -->
  <div class="flex-1 flex flex-col h-full bg-[#1a1a1a] relative">
      @if(isset($content))
          <!-- HEADER CHAT AKTIF -->
          <div class="w-full pt-8 pb-4 flex flex-col items-center flex-shrink-0">
              <h2 class="text-2xl font-bold text-gray-100 tracking-wide">{{ $activeSession->llm_chat_session_name ?? 'Obrolan' }}</h2>
              <div class="w-2/5 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mt-4"></div>
          </div>

          <!-- AREA PESAN -->
          <div class="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col md:px-20 lg:px-40 py-6 gap-6">
              @foreach($content as $message)
                  @if($message->role === 'user')
                      <!-- Pesan User (Kanan) -->
                      <div class="flex justify-end w-full">
                          <div class="bg-[#2a2a2a] text-gray-200 px-5 py-3 rounded-2xl max-w-[70%] sm:max-w-[60%] leading-relaxed shadow-sm">
                              {{ $message->content }}
                          </div>
                      </div>
                  @else
                      <!-- Pesan AI (Kiri) -->
                      <div class="flex justify-start w-full">
                          <div class="text-gray-300 px-5 py-3 max-w-[85%] sm:max-w-[75%] leading-relaxed prose prose-invert prose-p:my-1 prose-a:text-blue-400">
                              <!-- Bisa pakai Markdown parser nanti jika teksnya panjang -->
                              {!! nl2br(e($message->content)) !!}
                          </div>
                      </div>
                  @endif
              @endforeach
          </div>

          <!-- FORM BALASAN (REPLY) -->
          <div class="w-full pb-8 pt-4 flex-shrink-0 px-6 sm:px-20 lg:px-40">
              <form method="POST" action="{{ route('chat.reply', $llm_chat_session_id) }}" class="relative w-full shadow-lg">
                @csrf
                <input type="text" name="question" placeholder="Ask anything"
                       class="w-full bg-[#2a2a2a] text-gray-100 border border-[#333] focus:border-gray-500 focus:outline-none rounded-full pl-6 pr-14 py-4 transition-colors" autocomplete="off" required>
                <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
              </form>
          </div>
      @else
          <!-- KEADAAN KOSONG / NEW CHAT -->
          <div class="flex-1 flex flex-col items-center justify-center w-full px-6 sm:px-20 lg:px-40 pb-32">
              <div class="w-full max-w-2xl text-left mb-6">
                <!-- Teks Hi -->
                <p class="text-gray-400 text-lg mb-1">Hi {{ Auth::user()->name ?? 'User' }}</p>
                <h1 class="text-4xl font-bold text-gray-100">Where should we start?</h1>
              </div>

              <!-- FORM BUAT SESI BARU -->
              <div class="w-full max-w-2xl">
                  <form method="POST" action="{{ route('chat.ask') }}" class="relative shadow-lg">
                    @csrf
                    <input type="text" name="question" placeholder="Ask anything"
                           class="w-full bg-[#2a2a2a] text-gray-100 border border-[#333] hover:border-gray-600 focus:border-gray-500 focus:outline-none rounded-full pl-6 pr-14 py-4 transition-colors" autocomplete="off" required>
                    <button type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
                        </svg>
                    </button>
                  </form>
              </div>
          </div>
      @endif
  </div>
</body>
</html>
