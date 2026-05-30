package com.ia369.factoring.service;

import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.HashSet;
import java.util.Set;

@Service
public class CalendarService {

    private final Set<LocalDate> holidays2026;

    public CalendarService() {
        holidays2026 = new HashSet<>();
        // Feriados Nacionais 2026
        holidays2026.add(LocalDate.of(2026, 1, 1)); // Ano Novo
        holidays2026.add(LocalDate.of(2026, 2, 16)); // Carnaval
        holidays2026.add(LocalDate.of(2026, 2, 17)); // Carnaval
        holidays2026.add(LocalDate.of(2026, 2, 18)); // Quarta-feira de Cinzas
        holidays2026.add(LocalDate.of(2026, 4, 3)); // Sexta-feira Santa
        holidays2026.add(LocalDate.of(2026, 4, 21)); // Tiradentes
        holidays2026.add(LocalDate.of(2026, 5, 1)); // Dia do Trabalho
        holidays2026.add(LocalDate.of(2026, 6, 4)); // Corpus Christi
        holidays2026.add(LocalDate.of(2026, 9, 7)); // Independência
        holidays2026.add(LocalDate.of(2026, 10, 12)); // Nsa Sra Aparecida
        holidays2026.add(LocalDate.of(2026, 11, 2)); // Finados
        holidays2026.add(LocalDate.of(2026, 11, 15)); // Proclamação da República
        holidays2026.add(LocalDate.of(2026, 11, 20)); // Consciência Negra
        holidays2026.add(LocalDate.of(2026, 12, 25)); // Natal
    }

    public boolean isBusinessDay(LocalDate date) {
        DayOfWeek dw = date.getDayOfWeek();
        if (dw == DayOfWeek.SATURDAY || dw == DayOfWeek.SUNDAY) {
            return false;
        }
        return !holidays2026.contains(date);
    }

    public LocalDate nextBusinessDay(LocalDate date) {
        LocalDate current = date;
        while (!isBusinessDay(current)) {
            current = current.plusDays(1);
        }
        return current;
    }

    public int calculateBusinessDays(LocalDate start, LocalDate end) {
        int count = 0;
        LocalDate current = start.plusDays(1); // Normalmente começa a contar no dia seguinte
        while (!current.isAfter(end)) {
            if (isBusinessDay(current)) {
                count++;
            }
            current = current.plusDays(1);
        }
        return count;
    }
}
