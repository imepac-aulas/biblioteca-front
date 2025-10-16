package com.biblioteca.conecta.service;

import com.biblioteca.conecta.model.ReservaModel;
import com.biblioteca.conecta.repositories.ReservaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ReservaService {

    @Autowired
    private ReservaRepository reservaRepository;

    public List<ReservaModel> listarTodas() {
        return reservaRepository.findAll();
    }

    public ReservaModel salvar(ReservaModel reserva) {
        // No futuro, aqui entraria a lógica de verificar se o usuário e o item existem
        return reservaRepository.save(reserva);
    }
}