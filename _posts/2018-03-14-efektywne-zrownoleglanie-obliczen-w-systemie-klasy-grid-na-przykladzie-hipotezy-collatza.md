---
layout: post
lang: pl
title: "Efektywne zrównoleglanie obliczeń w systemie klasy grid na przykładzie hipotezy Collatza"
date: 2018-03-14 22:00:00 +0100
categories: comcute
---
W rozdziale zaprezentowano problem Collatza oraz sposób jego adaptacji, pozwalający na realizację obliczeń w systemie typu grid. Zidentyfikowano również pożądane cechy problemów obliczeniowych, dzięki którym mogą one zostać zrównoleglone w sposób efektywny w systemach typu grid i porównano je z cechami zadań realizowanych typowo przy użyciu klastrów obliczeniowych.

# 22.1. Hipoteza Collatza jako problem matematyczny

Problem Collatza to nierozstrzygnięty problem o wyjątkowo zwięzłym sformułowaniu, jak wiele innych zagadnień teorii liczb. Nazwa pochodzi od nazwiska niemieckiego matematyka Lothara Collatza, który sformułował pewną hipotezę w 1937 roku [4]. Zagadnienie to było również rozpatrywane przez polskiego matematyka Stanisława Ulama (stąd znane jest też jako problem Ulama lub problem 3x+1) [5, 6]. Problem Collatza jest problemem z zakresu teorii liczb i opiera się o ciąg liczbowy zdefiniowany następująco [7]:

{% include figure.html file="/images/image0016.png" alt="równanie" rcaption="(1)" %}

Analizując powyższą zależność, można wstępnie wywnioskować, że ciąg liczb naturalnych powinien dążyć do nieskończoności, gdyż każda liczba nieparzysta jest zwiększana trzykrotnie, a parzysta zmniejszana jest zaledwie dwukrotnie. Ponadto, każda liczba nieparzysta jest jeszcze zwiększana o 1 po przemnożeniu przez 3.

Natomiast Collatz postawił hipotezę, że niezależnie od tego, jaką liczbę wybierzemy jako początkową, uzyskamy ostatecznie cykl postaci 4, 2, 1 [1, 18]. Problem pozostaje otwarty do dnia dzisiejszego. Paul Erdős – jeden z matematyków uczestniczących w programie Manhattan – stwierdził, że matematyka nie jest gotowa na tego typu problemy [10]. Kontrast między prostotą sformułowania a złożonością samego problemu jest zaiste intrygujący.

Hipoteza była weryfikowana w sposób empiryczny dla liczb rzędu nawet 10<sup>18</sup> [12,17]. Dotychczas nie odnaleziono liczby początkowej, która nie prowadziłaby do wspomnianego wcześniej cyklu 4, 2, 1. Dlatego w systemie Comcute podjęto się empirycznej weryfikacji powyższej hipotezy dla liczb naturalnych większych niż 10<sup>18</sup>. Mimo że zrealizowany eksperyment jedynie potwierdził zbieżność do jedynki ciągu liczb Collatza w zakresie do 10<sup>30</sup>, to jednak umożliwił także sprawdzenie skalowalności obliczeń systemu gridowego.

# 22.2.  Własności istotne z punktu widzenia zrównoleglenia obliczeń

Hipoteza Collatza stwierdza, że bez względu na to od jakiej liczby rozpoczniemy obliczenia, w końcu dojdziemy do liczby 1 [13,16]. Weryfikacja, czy dana liczba spełnia hipotezę Collatza, odbywa się na komputerze internauty w sposób niezależny od innych testowanych liczb. Ta właśnie niezależność obliczeń umożliwia efektywne zrównoleglenie w sytuacji, gdy dysponujemy wieloma jednostkami wykonawczymi. W praktyce dochodziło do sytuacji, gdy kilkuset internautów uruchomiło program testujący problem Ulama jednocześnie. Dzięki niezależność obliczeń poszczególne jednostki wykonawcze nie muszą oczekiwać na zakończenie obliczeń na innych węzłach. Nie ma zatem zależności czasowych między operacjami realizowanymi przez różne węzły systemu typu grid.

Zatem jeśli jeden internauta realizuje obliczenia zaczynając od wartości 97, to ciąg 118 kolejnych liczb przedstawiono poniżej.

{% include figure.html file="/images/image002.jpg" alt="ciąg liczb" %}

W wypadku zwiększenia wartości początkowej do 1097, potrzebnych jest 137 przekształceń (sekwencję wartości zamieszczono poniżej).

{% include figure.html file="/images/image003.jpg" alt="ciąg liczb" %}

Jeśli zatem internauta otrzyma paczkę danych do testowania hipotezy Collatza z przedziału od 2 do 10 000, to szacuje się, że niezbędnych jest nie więcej niż 2 mln operacji zmiennoprzecinkowych na sekundę.

Warto podkreślić, że liczba operacji nie rośnie tak znacząco, jak wartości liczb. Przykładowo 303 operacji wymaga sprawdzenie zbieżności ciągu dla 10<sup>18</sup>, przy czym sekwencję obliczeń przedstawiono niżej.

{% include figure.html file="/images/image004.jpg" alt="ciąg liczb" %}

Natomiast zwiększenie wartości do 10<sup>36</sup> wymaga 515 operacji wyznaczających następujący ciąg liczb.

{% include figure.html file="/images/image005.jpg" alt="ciąg liczb" %}

Paradoksalnie testowanie dla 10<sup>72</sup> wymaga jedynie 496 operacji wyznaczających zbieżny ciąg liczb. Dla 10<sup>84</sup> wymagane są 622 operacje, a dla 10<sup>168</sup> wymagane są 880 operacje. Liczba wymaganych operacji rośnie zatem wolniej niż log n, n jest ilością cyfr w liczbie początkowej.

Kolejną istotną konsekwencją niezależności obliczeń jest brak konieczności synchronizacji stanu pomiędzy różnymi maszynami uczestniczącymi w realizacji zadania. Jest to szczególnie istotne w przypadku systemów typu grid, ponieważ w systemach tych poszczególne węzły mogą znajdować się w odległych geograficznie lokalizacjach. Łącze komunikacyjne pomiędzy takimi węzłami cechuje się relatywnie niskimi prędkościami transmisji danych i dużymi opóźnieniami. Zatem wszelka komunikacja wiąże się z dużym narzutem czasowym. Stoi to w kontraście do klastrów obliczeniowych, gdzie dysponujemy szybkim łączem pomiędzy węzłami, które cechuje się niskimi opóźnieniami. W przypadku sieci Infiniband są to prędkości rzędu gigabitów/sekundę i opóźnienia rzędu mikrosekund. Dla transmisji pomiędzy węzłami obliczeniowymi systemu typu grid oczekiwane prędkości są natomiast na poziomie megabitów/sekundę, a opóźnienia mogą sięgać setek milisekund.

Kolejną istotną cechą z punktu widzenia obliczeń w systemie typu grid jest stosunek czasu obliczeń do czasu komunikacji. Jak pokazano wcześniej, transmisja danych w systemach typu grid jest kosztowna. W przypadku problemów wymagających przesłania dużej ilości danych i relatywnie prostych obliczeń, przyspieszenie obliczeń dzięki ich zwielokrotnianiu zostanie zniweczone przez narzuty komunikacyjne i przyspieszenie całego systemu będzie znikome w stosunku do systemu działającego sekwencyjnie lub nawet łączny czas wykonania będzie dłuższy niż przy obliczeniach na pojedynczej maszynie. Tego typu problemy możemy efektywnie zrównoleglać na klastrach obliczeniowych. W przypadku badania hipotezy Collatza, danymi wejściowymi dla węzła obliczeniowego jest zakres liczb, który ma zostać przetestowany. Możemy go reprezentować w postaci pary uporządkowanej (początkowa wartość zakresu, ilość kolejnych liczb do przetestowania). Ilość obliczeń do wykonania na danym węźle obliczeniowym, w odniesieniu do rozmiaru danych wejściowy, została przedstawiona w tab. 22.1.

Tab. 22.1. Oszacowanie ilości obliczeń dla wybranych rozmiarów danych wejściowych

Dane wejściowe | Rozmiar danych wejściowych | Ilość obliczeń (liczb do przetestowania)
--- | --- | ---
1000 1000 | 9 bajtów | 10<sup>3</sup> liczb
1000 1000000 | 12 bajtów | 10<sup>6</sup> liczb
1000 1000000000 | 15 bajtów | 10<sup>9</sup> liczb

Na bazie danych zawartych w tabeli widoczne jest, że liniowy wzrost rozmiaru danych wejściowych wiąże się z wykładniczym zwiększeniem ilości obliczeń. Możemy zatem dowolnie wydłużać czas obliczeń na pojedynczym węźle, nie zwiększając przy tym znacznie ilość danych wejściowych. Należy jednak zauważyć, że wydłużenie czasu przetwarzania pojedynczej paczki danych wejściowych zwiększa ryzyko, iż nie otrzymamy wyniku dla tej paczki z powodu awarii łącza komunikacyjnego bądź odłączenia danego węzła obliczeniowego (np. rezygnacja uczestnika obliczeń w systemie opartym o ideę volunteer computing). Czas obliczeń należy zatem dobrać tak, aby był odpowiednio długi w stosunku do czasu komunikacji, jednak na tyle krótki, aby prawdopodobieństwo otrzymania odpowiedzi było wciąż wysokie. W przypadku systemu BOINC czas jednorazowych obliczeń ustalono na poziomie 15 sekund [3, 14].

Internauci zaangażowani w program BOINC uczestniczyli w projekcie 3x+1@home którego celem było wyznaczenie kontrprzykładu do hipotezy Collatza. Na stronie WWW zamkniętego już projektu można znaleźć listę liczb-kandydatów, dla których długość ciągu przed osiągnięciem pętli {4,2,1} wyniosła 1000 iteracji [15]. Przykładem takiej liczby, co udało się wyznaczyć za pomocą gridu Comcute, jest wartość zapisana poniżej. Sekwencja liczb składa się ze 1004.

{% include figure.html file="/images/image006.jpg" alt="ciaŋ liczb" %}

Kontynuacją zakończonego projektu 3x+1@home jest Collatz Conjecture wykorzystujący infrastrukturę BOINC.

Kolejnym istotnym aspektem jest rozmiar danych wyjściowych, jakie muszą zostać odesłane po przeprowadzeniu obliczeń. W przypadku problemu Collatza przyjąć można, że dane wyjściowe mają jedną z dwóch postaci:

* pojedynczy, jednobajtowy znacznik, wskazujący że w zadanym przedziale nie odnaleziono liczby, która zaprzeczałaby hipotezie,
* liczba, co do której wykryto, że zaprzecza hipotezie.

Odnalezienie jednej liczby, zaprzeczającej hipotezie Collatza, kończy proces obliczeniowy. Widać zatem, że ilość danych wyjściowych w przypadku omawianego problemu jest niewielka.

# 22.3. Optymalizacje sekwencyjnej odmiany problemu i ich ocena w kontekście systemu typu grid

W przypadku testowania poprawności hipotezy Collatza w środowisku sekwencyjnym, w sposób automatyczny narzucają się dwie możliwe optymalizacje.

Pierwsza z nich wiąże się ze spostrzeżeniem, że jeśli generując kolejne wartości ciągu (1) dla pewnej liczby początkowej n uzyskamy w pewnym kroku liczbę m, co do której wcześniej wykazaliśmy, że spełnia ona hipotezę, to liczba n również ją spełnia. Wynika to z faktu, że po uzyskaniu liczby m, każdy kolejny wyraz ciągu będzie taki sam, jak dla ciągu, który rozpoczął się od liczby m i osiągnął wartość 1 w jednym ze swoich wyrazów. Bazując na tym spostrzeżeniu możemy skrócić czas testowania poszczególnych liczb i zamiast zawsze dążyć do wartości 1, zatrzymywać obliczenia, gdy trafimy na wcześniej zweryfikowaną już liczbę. Wymaga to jednak utrzymywania informacji o  zweryfikowanych wcześniej liczbach. W szczególności, w systemie typu grid, węzły obliczeniowe musiałyby w ramach danych wyjściowych wysyłać wszystkie liczby, które nie zaprzeczają hipotezie. Natomiast w czasie testów kolejnych liczb węzły musiałyby odpytywać centralne repozytorium zawierające zweryfikowane już liczb. Zwiększyłoby to w sposób znaczący ilość komunikacji pomiędzy węzłami tak, że sięgnęłaby ona rzędu ilości obliczeń prowadzonych w systemie. Przy prędkości łącz komunikacyjnych pomiędzy odległymi węzłami systemu typu grid spowodowałoby to drastyczny spadem wydajności.

Druga możliwa optymalizacja bazuje na spostrzeżeniu, że uzyskanie liczby c<sub>n</sub> = 1 w ciągu liczb c<sub>1</sub>, c<sub>2</sub>, c<sub>3</sub> … c<sub>n</sub> zdefiniowanym zgodnie z formułą (1) oznacza, że nie tylko dowiedliśmy, iż liczba c1 nie przeczy hipotezie Collatza, ale również wszystkie liczby c<sub>2</sub>, c<sub>3</sub>… c<sub>n</sub>-1 nie stanowią jej zaprzeczenia. Wykorzystanie tego spostrzeżenia również wymaga wprowadzenia centralnego repozytorium zweryfikowanych liczb. Ilość danych koniecznych do przesłania w systemie typu grid byłaby tu jeszcze większa nić w poprzednim przypadku. Węzły obliczeniowe, poza liczbami początkowymi, musiałyby przesyłać również wszystkie elementy ciągu na drodze do elementu o wartości 1. Ze wzoru (1) wprost wynika, że ilość takich elementów jest równa przynajmniej logarytmowi o podstawie 2 z liczby początkowej. Zatem również ta modyfikacja nie stanowi optymalizacji dla obliczeń wykonywanych w systemie typu grid.

# 22.4. Problem Collatza a twierdzenie Gödla

Kurt Gödel sformułował w 1930 roku twierdzenie, że jeśli teoria T jest niesprzeczna i zawiera arytmetykę liczb naturalnych, to istnieją zdania A(x) takie, że chociaż wszystkie zdania

{:refdef: style="text-align:center;"}
A(0), A(1), A(2), …
{:refdef}

są twierdzeniami teorii T, to jednak zdanie ogólne

*dla każdej liczby naturalnej x zachodzi A(x)*

ani jego zaprzeczenie nie daje się wyprowadzić.

Przykładem takiego zdania w informatyce jest problem stopu programu komputerowego. Niech dany jest program P. Czy ten program skończy obliczenia w skończonym czasie? Czy zatem istnieje uniwersalny algorytm rozstrzygający o innych algorytmach, czy mają własność stopu?

W kontekście problemu Collatza widzimy, że problem stopu jest nierozstrzygalny. Oczywiście, gdyby udało się podważyć hipotezę Collatza, to nie byłby to dowód na nieprawdziwość twierdzenia Gödla.

# 22.5. Skalowalność obliczeń

W wyniku przeprowadzonych obliczeń testowano skalowalność systemu za pomocą obliczeń realizowanych na komputerach kilkuset internautów. Po kliknięciu na link projektu Comcute, internauta obserwuje zmieniające się wartości liczb, które podlegają testowaniu zgodnie z hipotezą Collatza (patrz rys. 22.1). Liczby dostarczane są do internauty w paczkach danych charakterystycznych dla systemu Comcute. Po przetestowaniu liczb z paczki danych ograniczonej z góry wartością 1000000000010452200, zwracana jest informacja (wartość 0 – porażka) do serwera S1, który przesyła ją do nadzorującego serwera W1. Serwery W scalają przedziały liczb z informacją o „porażce” i przekazują informację o scalonych przedziałach do serwera Z, który ostatecznie kompletuje zakres zweryfikowanych liczb naturalnych. W wypadku, gdyby została podważona hipoteza Collatza, przewidziano wysyłanie wartości 1.

{% include figure.html file="/images/image007.jpg" alt="Graficzny interfejs obliczeń internauty" caption="Rys. 22.1. Graficzny interfejs obliczeń internauty" %}  

Warto podkreślić, że kod programu zasadniczo nie zwiększa zajętości pamięci operacyjnej na komputerze internauty, co zaprezentowano na rys. 22.2 w oknie Historia użycia pamięci fizycznej. Natomiast internauta może odczuwać spadek mocy komputera, co obrazuje Historia użycia procesora na rys. 22.2.

{% include figure.html file="/images/image008.jpg" alt="Obciążenie zasobów komputera internauty" caption="Rys. 22.2. Obciążenie zasobów komputera internauty" %}  

Wartości maksymalne użycia procesora na poziomie 90% osiągane są w okresach, kiedy procesor internauty przetwarza paczkę danych od serwera S. Natomiast, wartości minimalne ok. 10% odpowiadają sytuacjom, gdy odbywała się transmisja paczek danych z serwera. Zatem im szybsza sieć, tym większa wydajność. Ponadto, paczki danych powinny być przesyłane w wielkości uzależnionej od przepustowości połączeń (mogą być mniejsze, przy większej przepustowości), a także od wydajności komputera internauty (im wydajniejszy, tym większe paczki danych).

W przypadku uzyskania kolejnego połączenia internauty z systemem Comcute i uruchomienia drugiego zadania, użycie procesora nieznacznie rośnie (nawet do 99%), ale także regularnie maleje do wielkości kilku procent (rys. 22.3). Proste prace na komputerze takie jak przygotowywanie dokumentów lub prezentacji, czy serfowanie po Internecie mogą być realizowane w tym wypadku bez zauważenia opóźnień.

{% include figure.html file="/images/image009.jpg" alt="Obciążenie zasobów komputera internauty przy dwóch równoległych obliczeniach gridowych" caption="Rys. 22.3. Obciążenie zasobów komputera internauty przy dwóch równoległych obliczeniach gridowych" %}  

{% include figure.html file="/images/image010.jpg" alt="Obciążenie zasobów komputera internauty przy czterech równoległych obliczeniach gridowych" caption="Rys. 22.4. Obciążenie zasobów komputera internauty przy czterech równoległych obliczeniach gridowych" %}  

Powyższe dwa połączenia realizowane były za pomocą przeglądarki Internet Explorer w wersji 9. W przypadku uzyskania trzeciego połączenia za pomocą przeglądarki Firefox i uruchomienia trzeciego i czwartego zadania, użycie procesora także nieznacznie rośnie (nawet do 99%), ale także regularnie maleje do wielkości kilku procent (Rys. 22.4). Proste prace na komputerze takie jak przygotowywanie dokumentów lub prezentacji, czy surfowanie po Internecie mogą być w dalszym ciągu realizowane bez zauważenia opóźnień.

Każde nowe zadanie powoduje niewielki wzrost zajętości pamięci operacyjnej, ale za to wywołanie tego zadania w nowej przeglądarce, to wzrost zajętości o około 120 MB. Na rys. 22.5 przedstawiono obciążenie zasobów internauty przy dziesięciu zadaniach wykonywanych w środowisku trzech przeglądarek IE, Firefox i Safari.

{% include figure.html file="/images/image011.jpg" alt="Obciążenie zasobów komputera internauty przy dziesięciu równoległych obliczeniach gridowych wykonywanych w środowisku trzech przeglądarek" caption="Rys. 22.5. Obciążenie zasobów komputera internauty przy dziesięciu równoległych obliczeniach gridowych wykonywanych w środowisku trzech przeglądarek" %}  

Przykładem zależności liczby iteracji od wartości początkowej liczb w problemie 3x+1 jest graficzna reprezentacja na rys. 22.6.

{% include figure.html file="/images/image0121.png" alt="Zależność liczby iteracji od wartości początkowej liczby w problemie Collatza" caption="Rys. 22.6. Zależność liczby iteracji od wartości początkowej liczby w problemie Collatza [18]" %}  

# 22.6. Podsumowanie

Problem testowania hipotezy Collatza posiada cechy, które pozwalają na jego efektywne zrównoleglenie w systemach typu grid. Najistotniejsze z nich to niezależność obliczeń i korzystny stosunek czasu obliczeń na węzłach do czasu komunikacji, który można w łatwy sposób regulować poprzez modyfikację danych wejściowych. Widać dodatkowo, że zmiany, które skracają czas obliczeń w przypadku wykonania sekwencyjnego, mogą niekorzystnie wpływać na wydajność systemu typu grid. Wszelkie optymalizacje należy zawsze oceniać w kontekście docelowego środowiska, w którym będą wykorzystywane.

# 22.7. Wykaz literatury

1. Wirsching Günther J.: The Dynamical System Generated by the 3n+1 Function. Lecture Notes in Mathematics, No. 1681. Springer-Verlag, 1998
2. Matthews K., The 3x+1 Problem: An Annotated Bibliography, II (2000-2009), Cornell University Library
3. Vance, Ashlee: Sun and UC Berkeley are about to BOINC. The Register, 2003
4. Lagarias Jeffrey C.: The 3x + 1 problem: An annotated bibliography, II, arXiv:math.NT/0608208, 2006
5. Lagarias Jeffrey C: Syracuse problem, in Hazewinkel, Michiel, Encyclopedia of Mathematics, Springer, 2001
6. Wirsching Günther J: The Dynamical System Generated by the 3n+1 Function. Number 1681 in Lecture Notes in Mathematics. Springer-Verlag, 1998
7. Chamberland Marc: A continuous extension of the 3x + 1 problem to the real line. Dynam. Contin. Discrete Impuls Systems 2:4 pp. 495–509, 1996
8. Letherman Simon, Schleicher Dierk, Wood Reg: The (3n + 1)-Problem and Holomorphic Dynamics. Experimental Mathematics 8:3, pp.241–252, 1999
9. De Mol, Liesbeth: Tag systems and Collatz-like functions, Theoretical Computer Science, 390:1, 92–101, January 2008
10. Bruschi, Mario: A generalization of the Collatz problem and conjecture. arXiv:0810.5169 [math.NT], 2008
11. Andrei Stefan, Masalagiu Cristian: About the Collatz conjecture. Acta Informatica 35 (2): 167. , 1998
12. Van Bendegem, Jean Paul: The Collatz Conjecture: A Case Study in Mathematical Problem Solving, Logic and Logical Philosophy, Volume 14 (2005), 7–23
13. Belaga Edward G., Mignotte Maurice: Walking Cautiously into the Collatz Wilderness: Algorithmically, Number Theoretically, Randomly, Fourth Colloquium on Mathematics and Computer Science : Algorithms, Trees, Combinatorics and Probabilities, pp.18–22, Institut Élie Cartan, Nancy, France, September 2006
14. Belaga Edward G., Mignotte Maurice: Embedding the 3x+1 Conjecture in a 3x+d Context, Experimental Mathematics, Volume 7, issue 2, 1998
15. Steiner, R.P.: A theorem on the Syracuse problem, Proceedings of the 7th Manitoba Conference on Numerical Mathematics, pp. 553–559, 1977
16. Simons J., de Weger B.: Theoretical and computational bounds for m-cycles of the 3n + 1 problem, Acta Arithmetica, (online version 1.0, November 18, 2003), 2005
17. Sinyor J.: The 3x+1 Problem as a String Rewriting System, International Journal of Mathematics and Mathematical Sciences, Volume 2010
18. Guy Richard K.: Unsolved problems in Number Theory,E17: Permutation Sequences and the Collatz Conjecture, pp.336–337, Springer, 2004
