package com.biblioteca.conecta.controller;

import com.biblioteca.conecta.model.ReservaModel;
import com.biblioteca.conecta.service.ReservaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reservas")
public class ReservaController {

    @Autowired
    private ReservaService reservaService;

    @GetMapping
    public List<ReservaModel> listarReservas() {
        return reservaService.listarTodas();
    }

    @PostMapping
    public ResponseEntity<ReservaModel> criarReserva(@RequestBody ReservaModel reserva) {
        ReservaModel novaReserva = reservaService.salvar(reserva);
        return new ResponseEntity<>(novaReserva, HttpStatus.CREATED);
    }
}