---
layout: post
title:  "Berkeley Open Infrastructure for Network Computing"
date:   2018-03-14 14:44:58 +0100
categories: comcute
authors:
 - name: "Piotr Brudło"
   email: pebrd@eti.pg.edu.pl
---

W rozdziale skoncentrowano się na systemie BOINC (ang. *BerkeleyOpen Infrastructure for Network Computing*) jako interesującym rozwiązaniu integrującym rozproszone moce obliczeniowe osobistych komputerów typu PC w Internecie. Przedstawiono zasadę działania opisywanej platformy [1]. W dalszej części zaprezentowano kilka wybranych projektów naukowych wykorzystujących BOINC, które są reprezentatywne w zakresie zastosowania systemu w ujęciu założonego paradygmatu przetwarzania. Celem jest wprowadzenie w zagadnienia internetowego przetwarzania rozproszonego ze szczególnym zwróceniem uwagi na aspekty praktyczne. Pokazano szereg realizowanych projektów demonstrujących praktyczne wykorzystanie tego typu rozwiązań w przedsięwzięciach dużej skali [2].

# 3.1. Klient w systemie BOINC

BOINC składa się z programu klienta i serwera danych wykorzystującego bazę danych. BOINC nie jest jednak specjalizowaną aplikacją — to platforma, która może wspierać wiele różnych aplikacji. Dzięki temu można ją wykorzystywać do równoczesnego prowadzenia wielu obliczeń. Klient BOINC (ang. *Core Client lub Boinc Daemon*) jest programem odpowiedzialnym za komunikację oraz kontrolę nad aplikacjami liczącymi. Klient BOINC jest obecny przez cały czas w pamięci RAM, w przeciwieństwie do Menedżera BOINC, od którego odbiera polecenia, i którym można go konfigurować. To właśnie aplikacja kliencka decyduje jaka próbka i w jakim czasie będzie liczona. Również komunikuje się ona z serwerami projektów naukowych, z których pochodzą próbki.

# 3.2. Serwery BOINC

Oprogramowanie BOINC dzieli się na oprogramowanie pracujące po stronie serwera projektu oraz to uruchamiane na komputerze uczestnika danego projektu naukowego. Do najważniejszych aplikacji serwera należy *Scheduler* – serwer harmonogramów, który rozdziela fragmenty danych do obliczeń pomiędzy komputery – węzły oraz przyjmuje uzyskane od nich wyniki. *Scheduler* kontroluje i określa zasoby podczas dystrybucji jednostek. Oznacza to, że serwer nie przydzieli pracy wymagającej większej ilości pamięci RAM, niż komputer użytkownika posiada. Przy podziale pracy uwzględnia się m.in.: ilość pamięci RAM, moc CPU i GPU, średni czas w ciągu doby, jaki komputery liczące przeznaczają na obliczenia, system operacyjny oraz platformę programową (np. MAC, SUN). Dzięki temu słabszy komputer nie zostanie za bardzo obciążony, natomiast mocniejsza maszyna będzie lepiej wykorzystana. W przypadku, kiedy węzeł liczący nie posiada jeszcze zainstalowanej aplikacji przetwarzającej dane, to zostaje ona przesłana do węzła. W obrębie jednego projektu możliwe jest działanie kilku aplikacji, a dane wysyłane przeznaczone są dla jednej z nich. Komputer użytkownika pobiera aplikacje i pliki wejściowe z serwera danych (ang. data serwer) danego projektu. Programy pobierane są od razu po dołączeniu do projektu, przetwarzane są one następnie na komputerach uczestniczących w tym projekcie, pobierają odpowiednie dane i tworzą pliki wyjściowe, które są wysyłane na serwer danych. Komputer użytkownika po zgłoszeniu rezultatów swoich wyników do serwera harmonogramów otrzymuje od niego dalsze instrukcje. Za wykonaną pracę obliczeniową właściciel węzła liczącego otrzymuje punkty.

# 3.3. Jednostki obliczeniowe *Work Units*

Work Unit (WU) jest angielską nazwą jednostki roboczej lub pakietu, porcją lub próbką danych generowanych przez dany projekt naukowy. Pakiety następnie są „klonowane”, co oznacza, że powstaje kilka identycznych próbek. Wyniki mogą być częścią lub jedną z kopii WU, gdy zastosowana jest redundancja. Próbki rozsyłane są do użytkowników, po czym po wykonaniu przez klienta obliczeń zwraca się je na serwer dedykowany projektu. Odesłane wyniki umożliwiają wybranie wyniku kanonicznego (ang. canonical result), nazywanego również wzorcowym dla danej jednostki roboczej i dodanie go do bazy danych przez aplikację Asymilator (ang. Assimilator). Jest to aplikacja serwera BOINC, która zajmuje się jednostkami roboczymi z zakończonym procesem obliczeń i z wynikiem wzorcowym lub błędnym. Program ten może również prosić o wygenerowanie kolejnej próbki. Istotną funkcją oprogramowaniem BOINC jest „punkt przywracania próbki” – Checkpoint. Polega to zapisaniu dotychczas przetworzonego fragmentu próbki na dysku, dzięki czemu nie będzie liczona od początku po przerwie w obliczeniach.

Platforma BOINC stosuje redundancję, aby zapobiec powstawaniu potencjalnych błędów w czasie przeliczania próbki na komputerze użytkownika. W celu uzyskania poprawnych wyników rozesłanych próbek, powiela się je, po czym weryfikuje ich zgodność i sprawdza poprawność. Kolejnym komponentem aplikacji BOINC jest tranzycjoner (ang. *Transitioner*), który zajmuje się przejściami stanów jednostek roboczych oraz próbek. Śledzi on próbki będące w trakcie obliczania, po czym zmienia ich statusy w odpowiednim momencie. Sprawdza czy dana jednostka jest gotowa do wysłania, a także czy dana próbka została rozesłana, czy jest poprawna oraz czy można ją już usunąć. Tranzycjoner ma również możliwość generowania nowych próbek, nadawania statusu jednostki jako nieodwracalnie błędnej, bądź wydawania instrukcji weryfikacji i asymilacji jednostki. BOINC wykorzystuje również redundancję homogeniczną polegającą na tworzeniu klas systemów bądź procesorów, które odsyłają takie same wyniki w ramach danej aplikacji. Uzyskane w ten sposób informacje mają zastosowanie przy wiarygodnym rozsyłaniu próbek.

# 3.4. Wybrane projekty

Z platformy BOINC korzysta wiele projektów z różnych dziedzin nauki [3, 4, 5]. Każdy projekt aplikujący do BOINC jest formalnie i merytorycznie weryfikowany i zatwierdzany. Aplikacja, która uzyska aprobatę Uniwersytetu Kalifornijskiego w Berkeley, otrzymuje unikalny podpis cyfrowy. Od momentu uzyskania podpisu cyfrowego projekt będzie mógł korzystać z zasobów technologii BOINC. Projekty niezweryfikowane mogłyby powodować niestabilną pracę systemu komputera, a ich aplikacje łącząc się z Internetem w celu pobrania danych groziłyby infekcją złośliwego oprogramowania. Projekty działające w sieci muszą być bezpieczne, ponieważ korzystają z udostępnionej im nieodpłatnie wolnej mocy obliczeniowej użytkowników zwykłych komputerów PC [6, 7].

Pełną aktualną listę projektów można znaleźć na stronie Uniwersytetu w Berkeley. Jak do tej pory platforma BOINC nie została jeszcze użyta w celu rozpowszechnienia złośliwego oprogramowania.

# 3.4.1. SETI@home Classic

Program SETI został zapoczątkowany 19 września 1959 roku. W artykule zatytułowanym „*Searching for Interstellar Communications*” opublikowanym w Nature przez dwóch młodych fizyków Philipa Morrisona i Giuseppe Cocconi’ego została opisana możliwość komunikowania się w przestrzeni kosmicznej za pomocą fal radiowych o długości 21 cm (1420MHz).

W SETI@home występuje redundancja obliczeń, każdy pakiet danych jest przetwarzany wielokrotnie, co pozwala wykryć i odrzucić wyniki generowane przez uszkodzone lub fałszywe programy klienckie. Poziom nadmiarowości obliczeń wzrasta wraz z liczbą klientów i ich średnią prędkością, ponieważ pakiety wytwarzane są w ograniczonym tempie. Ilości danych nadmiarowych wzrastają w ciągu życia projektu. Poprzez zwiększanie liczby obliczeń wykonywanych przez klienta dla pojedynczej próbki utrzymywany jest poziom nadmiarowości mieszczący się w środku skali zapotrzebowania. Pakiety tworzy i dystrybuuje kompleksowy serwer w laboratorium. Jednostki robocze powstają poprzez podzielenie 2,5MHz sygnału na 256 przedziałów, każdy szerokości około 10kHz. Następnie każdy taki przedział jest dzielony na 100 sekundowe segmenty, zachodzące na siebie na 20 sekund, czyli szukany sygnał będzie się zawierał przynajmniej w jednej próbce. Próbki mają po 350KB. Do przechowywania informacji o próbkach, wynikach, użytkownikach, etc. dotyczących projektu stosowana jest relacyjna baza danych. Wielowątkowy serwer przechowujący dane odpowiada także za prawidłowe rozprowadzenie danych wśród całości użytkowników internetowych.

Utrzymanie systemu serwerowego w ciągłym ruchu jest najbardziej skomplikowaną i kosztowną częścią projektu SETI@home. Warianty usterek sprzętu i oprogramowania są nieprzewidywalne. Dlatego architektura jest konstruowana w kierunku jak najmniejszej zależności między podsystemami. Wielowątkowy serwer można uruchomić tak, aby przy wyliczaniu pakietu do wysłania korzystał on z informacji zawartych w plikach dyskowych zamiast bazy danych, która może być wyłączona z użycia (np. awaria karty sieciowej, pamięci, procesora, płyty głównej).

# 3.4.2. QMC@home

Quantum Monte Carlo – QMC, to projekt z dziedziny chemii kwantowej. Bazuje on na metodzie Monte Carlo. Powstał w Theoretical Organic Chemistry University of Münster w Niemczech. Metoda została opracowana i pierwszy raz zastosowana przez Stanisława Ulama, uczestnika tajnych amerykańskich badań nad pierwszą bombą atomową.

Metoda Monte Carlo jest stosowana do modelowania matematycznego zagadnień (m.in. fizyka, chemia, ekonomia, mechanika) zbyt złożonych, aby można było przewidzieć ich wyniki za pomocą podejścia analitycznego. W metodzie tej wielkości charakteryzujące proces są wybierane losowo zgodnie z rozkładem, który musi być znany.

QMC@home został zaprojektowany w celu zastosowania metody Monte Carlo do celów chemii kwantowej. Zadaniem projektu jest testowanie, udoskonalanie i wdrażanie tej nowej, obiecującej metody.

# 3.4.3. Climateprediction.net

Climateprediction.net ma przewidywać zmiany klimatyczne zachodzące na Ziemi, jak również stworzyć lepsze, bardziej niezawodne modele matematyczne, które umożliwią dokładniejsze długoterminowe prognozowanie pogody. 26 sierpnia 2004 roku projekt Climateprediction.net został przeniesiony na platformę BOINC. Jest największym z dotychczas przeprowadzonych eksperymentów tego typu.

Na projekt Climateprediction.net składają się trzy odrębne eksperymenty:

* pierwszy – bada używany model
* drugi – sprawdza jak modele odtwarzają klimat z przeszłości
* trzeci – przedstawia prognozę klimatu dla XXI wieku

Każdy z dystrybuowanych modeli jest używany dla wszystkich trzech eksperymentów. Poszczególne modele są autonomiczne i znacząco różnią się od pozostałych. Różne są warunki początkowe, w jakich zostały uruchomione, atrybuty wymuszających konkretny stan klimatu oraz parametry, które tworzą rzeczywisty model. Model klimatu musi posiadać pewną liczbę przybliżeń, zwanych parametryzacją. Oznacza to, że w modelu są określone liczby, które biorą pod uwagę zadane stałe wartości. Jednak wartości te nie są ściśle znane, a ich zakres jest jedynie prawdopodobny. Eksperyment bada wpływ na modelowany klimat około dwudziestu najbardziej kluczowych parametrów modelu – takich jak np. stosunek między liczbą kropel w chmurze a ilością faktycznych opadów. Niektóre kombinacje parametrów mogą odtwarzać klimat z przeszłości bardzo dobrze, ale podają znacznie odmienne prognozy na to, co może się wydarzyć w przyszłości.

Projekt Climateprediction.net pozwala na lepsze zrozumienie działania i zmian zachodzących w tak bardzo skomplikowanym systemie jakim jest klimat globalny. Jest próbą określenia, jakie czynniki (czy generowane przez ludzkość, czy naturalne) wpływają na jego zmiany.

# 3.4.4. LHC@home

LHC@home jest projektem, który dostarcza danych umożliwiających kalibrację Wielkiego Zderzacza Hadronów – Large Hadron Collider w celu uzyskania jak najlepszej stabilności rozpędzanych wiązek cząstek. Projekt oficjalnie rozpoczęto w 50-tą rocznicę założenia CERN, tj. 29 września 2004 roku.

Wielki Zderzacz Hadronów został zbudowany w największym na świecie laboratorium fizyki cząstek, w Europejskim Centrum Badań Jądrowych – CERN. Akcelerator cząstek został uruchomiony we wrześniu 2008 roku. Dzięki akceleratorowi naukowcy chcą odkryć nieznane dotąd cząstki, odtwarzając warunki jakie panowały we wszechświecie 13,7 mld lat temu, kilka milionowych ułamków sekundy po Wielkim Wybuchu.

LHC zajął miejsce akceleratora zderzającego elektrony i pozytony – LEP. Główny obwód LHC zajmuje 26 659 metrowy tunel, na głębokości od 50 do 175 metrów między Jeziorem Genewskim a górami Jury, gdzie przebiega granica francusko-szwajcarska. Przyśpiesza dwie osobne wiązki protonów do energii 7 TeV (teraelektronowolt), po czym je czołowo zderza, wówczas osiągają one energię 14 TeV. Oprócz protonów akcelerator jest w stanie zderzać jony pierwiastków ciężkich (energia zderzenia nawet do 1148 TeV). Wokół czterech miejsc zderzeń wiązek w ogromnych podziemnych halach zbudowano cztery detektory dla dużych eksperymentów: ATLAS, CMS, LHCb i ALICE. Dodatkowo przy dwóch pierwszych detektorach znajdują się detektory dwóch małych eksperymentów LHCf i TOTEM, które analizują cząstki rozproszone lub produkowane pod małymi kątami.

# 3.5. Aspekty praktyczne

Przystępując do platformy BOINC można mieć słuszne wątpliwości, czy aby jest to celowe, jakie poniesiemy koszty, czy i jaki efekt będziemy z tego otrzymywać. Poprzez platformy systemów rozproszonych każdy z internautów może wspomóc badania z różnych dziedzin naukowych (medycyna, fizyka, chemia, astronomia, matematyka) poprzez użyczenie wolnej mocy obliczeniowej swojego komputera. Uczestnictwo w projekcie wymaga jedynie rejestracji, instalacji niewielkiej aplikacji oraz dostępu do Internetu. Interesujące może być to, że prowadzone komputerowe symulacje obliczeń mają odzwierciedlenie w rzeczywistości. W przypadku Folding@home symulacje komputerowe cząsteczek białka składających się w przestrzeni potwierdzono laboratoryjnie, że są praktycznie w 100% zgodne z wynikami uzyskanymi w doświadczeniach. W innym projekcie – LHC@home takie symulacje pozwalają uniknąć zniszczenia akceleratora poprzez wadliwą jego kalibrację. Uczestnictwo w projektach obliczeń rozproszonych można określić jako wolontariat w służbie nauki, której celem jest dokonanie przełomowych odkryć przy użyciu nowoczesnej technologii, co przełoży się na poprawę naszego życia w przyszłości. Owe wsparcie nauki to również możliwość sportowej rywalizacji. Organizacje prowadzące projekty naukowe, po analizie danych zwykle publikują wyniki badań na swoich stronach internetowych, tak aby były one dostępne dla każdego zainteresowanego. Osoby z takich samych projektów łączą się w zespoły, np.: FatumTech BOINC Team czy BOINC@Poland. Zespoły konkurują ze sobą w ilości obliczonych jednostek, prowadzone są statystyki i rankingi. Za udział w niektórych projektach można otrzymać certyfikat potwierdzający udział w obliczeniach [8].

# 3.6. Uwarunkowania prawne

Przed pobraniem instalacji aplikacji klienckiej BOINC napotykamy następujące zdanie: „To oprogramowanie możesz uruchomić tylko na swoim komputerze lub za zgodą właściciela komputera”. Należy się do tego bezwzględnie stosować. Regulacje oraz ustalenia prawne obowiązują wszystkich uczestników projektu.

# 3.7. Podsumowanie

Bogata literatura opisowa oraz dostępność zarówno specyfikacji projektowej jak i rezultatów tworzenia systemu BOINC pozwalają na opracowanie określonych praktycznych założeń koncepcyjnych dla wykorzystania tego systemu. Przyjęty model przetwarzania stwarza ogromne możliwości zarówno w zakresie procedur obliczeniowych jak i wielkości zbiorów danych. System BOINC jest w szerokim zakresie skalowalny zwłaszcza w obszarze parametryzowanych danych. Aktywny i czynny odzew środowiska internautów we wspomaganiu całości projektu poprzez oferowanie, a następnie praktyczne udostępnianie własnych, niewykorzystywanych mocy obliczeniowych świadczy o słuszności przyjętej koncepcji całościowej. W chwili obecnej zarówno zakres realizowanych projektów, jak i spektrum otrzymywanych wyników, wskazuje, iż tego typu podejście znajdować będzie coraz dalej idące zastosowania w rozwiązywaniu złożonych realizacyjnie oraz kosztownych obliczeniowo zagadnień natury informatycznej. Na zwrócenie uwagi zasługuje zastosowany paradygmat realizacyjny typu volunteer computing, pozwalający z jednej strony na włączenie rzeszy internautów do projektów przez wykorzystanie ich komputerów osobistych, a z drugiej strony przez aktywizację informatyczną osób zainteresowanych tego typu przetwarzaniem.

# 3.8. Wykaz literatury

1. Strona domowa projektu BOINC (dokumentacja, zasoby, pliki systemowe), U.C. Berkeley: [http://boinc.berkeley.edu/](http://boinc.berkeley.edu/), 2012
2. Strona projektu SETI Classic (opis, cele, realizacja): [http://www.boincatpoland.org/wiki/SETI_Classic](http://www.boincatpoland.org/wiki/SETI_Classic), 2012
3. Sky and Telescope, magazyn astronomiczny, strona o projekcie SETI: [http://www.skyandtelescope.com/resources/seti/3304581.html](http://www.skyandtelescope.com/resources/seti/3304581.html), 2012
4. SETI@home, An experiment in Public Resource Computing, U.C. Berkeley: [http://setiathome.berkeley.edu/sah_papers/cacm.php](http://setiathome.berkeley.edu/sah_papers/cacm.php), 2012
5. Volunteer Computing for Biomedicine (strona startowa dla projektu): [http://www.gpugrid.net/](http://www.gpugrid.net/), 2012
6. Validation Process in BOINC (założenia weryfikacyjne dla obliczeń): [http://www.boinc-wiki.info/Validation](http://www.boinc-wiki.info/Validation), 2012
7. Validation Process in BOINC (prezentacja przykładów praktycznych): [http://www.boinc-wiki.info/A_Simple_Example_of_the_Validation_Process](http://www.boinc-wiki.info/A_Simple_Example_of_the_Validation_Process), 2012
8. Pomierna Paulina: Projekty przetwarzania rozproszonego oparte na platformie BOINC, Praca inżynierska, Politechnika Gdańska, Wydział ETI, Gdańsk 2010
