<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>LLM Chat - Zeno</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  @vite(['resources/css/app.css'])
  <style>
    body {
        font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body class="bg-[#0a0a0a] text-gray-200 h-screen w-screen flex gap-4 overflow-hidden font-sans antialiased text-sm p-4 sm:p-6 lg:p-4">

  <!-- SIDEBAR (KIRI) -->
  <div class="w-64 bg-[#111] border border-white/20 rounded-3xl flex flex-col p-4 flex-shrink-0 overflow-hidden shadow-2xl relative z-10">
      <a href="{{ route('chat.index') }}" class="block w-full">
          <button class="w-full bg-[#2a2a2a] hover:bg-[#333] transition-colors text-gray-300 py-2.5 px-4 rounded-xl mb-6 text-sm text-left flex items-center shadow-sm">
             <span class="mr-2 opacity-70">+</span> New Chat
          </button>
      </a>

      <div class="text-xs font-semibold text-gray-500 mb-3 px-2">Chats</div>

      <div class="scrollbar-app flex flex-col gap-1 overflow-y-auto pb-4">
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
  <div class="flex-1 flex flex-col h-full bg-[#1a1a1a] border border-white/20 rounded-3xl overflow-hidden shadow-2xl relative">
      @if(isset($content))
          <!-- HEADER CHAT AKTIF -->
          <div class="w-full pt-8 pb-4 flex flex-col items-center flex-shrink-0">
              <h2 class="text-2xl font-bold text-gray-100 tracking-wide">{{ $activeSession->llm_chat_session_name ?? 'Obrolan' }}</h2>
              <div class="w-2/5 h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent mt-4"></div>
          </div>

          <!-- AREA PESAN -->
          <div id="chat-messages" class="scrollbar-app flex-1 overflow-y-auto w-full flex flex-col md:px-20 lg:px-40 py-6 gap-6 pb-24">
              @foreach($content as $message)
                  @if($message->role === 'user')
                      <!-- Pesan User (Kanan) -->
                      <div class="flex justify-end w-full">
                          <div class="bg-[#2a2a2a] text-gray-200 px-5 py-3 rounded-3xl max-w-[70%] sm:max-w-[60%] leading-relaxed shadow-sm">
                              {{ $message->content }}
                          </div>
                      </div>
                  @else
                      <!-- Pesan AI (Kiri) -->
                      <div class="flex justify-start w-full">
                          <div class="text-gray-300 px-5 py-3 max-w-[85%] sm:max-w-[75%] leading-relaxed ai-prose">
                              {!! \Illuminate\Support\Str::markdown($message->content, ['html_input' => 'strip', 'allow_unsafe_links' => false]) !!}
                          </div>
                      </div>
                  @endif
              @endforeach
          </div>

          <!-- FORM BALASAN (REPLY) -->
          <div class="w-full pb-8 pt-4 flex-shrink-0 px-6 sm:px-20 lg:px-40 bg-[#1a1a1a] absolute bottom-0 left-0 z-20">
              <form id="chat-form" method="POST" action="{{ route('chat.reply', $llm_chat_session_id) }}" class="relative w-full shadow-lg">
                @csrf
                <input id="chat-input" type="text" name="question" placeholder="Ask anything"
                       class="w-full bg-[#2a2a2a] text-gray-100 border border-[#333] focus:border-gray-500 focus:outline-none rounded-full pl-6 pr-14 py-4 transition-colors font-medium" autocomplete="off" required>
                <button id="chat-submit" type="submit" class="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-200 hover:bg-white text-gray-900 w-10 h-10 rounded-full flex items-center justify-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 10.5L12 6m0 0l4 4.5M12 6v12" />
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
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M8 10.5L12 6m0 0l4 4.5M12 6v12" />
                        </svg>
                    </button>
                  </form>
              </div>
          </div>
      @endif
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
        const chatContainer = document.getElementById('chat-messages');
        const form = document.getElementById('chat-form');
        const input = document.getElementById('chat-input');
        const submitBtn = document.getElementById('chat-submit');

        // Auto scroll to latest message on load
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }

        if (form) {
            form.addEventListener('submit', function(e) {
                // Return if empty
                if (!input.value.trim()) return;

                const userMessage = input.value;

                // 1. Add User message bubble right away
                const userHtml = `
                    <div class="flex justify-end w-full animate-fade-in-up">
                        <div class="bg-[#2a2a2a] text-gray-200 px-5 py-3 rounded-3xl max-w-[70%] sm:max-w-[60%] leading-relaxed shadow-sm">
                            ${escapeHtml(userMessage)}
                        </div>
                    </div>
                `;
                chatContainer.insertAdjacentHTML('beforeend', userHtml);
                chatContainer.scrollTop = chatContainer.scrollHeight;

                // 2. Add AI loading bubble right away
                const aiLoadingHtml = `
                    <div id="ai-loading" class="flex justify-start w-full animate-fade-in-up">
                        <div class="text-gray-300 px-5 py-4 max-w-[85%] sm:max-w-[75%] flex items-center space-x-2">
                            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-75"></div>
                            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-150"></div>
                            <div class="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-300"></div>
                        </div>
                    </div>
                `;
                chatContainer.insertAdjacentHTML('beforeend', aiLoadingHtml);
                chatContainer.scrollTop = chatContainer.scrollHeight;

                // 3. Disable UI temporarily
                input.readOnly = true;
                input.classList.add('opacity-50');
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50');

                // Allow the real submit to proceed to backend! The page will be replaced by the server response
            });
        }

        // Helper func to prevent XSS in optimistic UI
        function escapeHtml(text) {
            return text.replace(/&/g, "&amp;")
                       .replace(/</g, "&lt;")
                       .replace(/>/g, "&gt;")
                       .replace(/"/g, "&quot;")
                       .replace(/'/g, "&#039;");
        }
    });
  </script>

  <style>
    @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
        animation: fadeInUp 0.3s ease-out forwards;
    }

    .delay-75 { animation-delay: 75ms; }
    .delay-150 { animation-delay: 150ms; }
    .delay-300 { animation-delay: 300ms; }

    /* Custom AI text styles */
    .ai-prose p { margin-bottom: 0.75em; }
    .ai-prose p:last-child { margin-bottom: 0; }
    .ai-prose strong { color: white; font-weight: 600; }
    .ai-prose ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.75em; }
    .ai-prose ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.75em; }
    .ai-prose code { background: #333; padding: 0.1em 0.3em; border-radius: 4px; font-family: monospace; font-size: 0.9em; }
    .ai-prose pre { background: #111; padding: 1em; border-radius: 8px; overflow-x: auto; margin-bottom: 0.75em; }
    .ai-prose pre code { background: transparent; padding: 0; }
    .ai-prose a { color: #60a5fa; text-decoration: underline; }
  </style>
</body>
</html>
