"use client"

import { useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

const LoginPage = () => {
  const [dni, setDni] = useState("");
  const router = useRouter();
  const { setUser } = useUser();

  const handleLogin = async () => {
    try {
      console.log("DNI ingresado:", dni); // 👈 Verifica si realmente hay un valor acá

      if (!dni.trim()) {
        alert("Por favor ingresá un DNI válido.");
        return;
      }
      
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/roles/${dni}`);
      const data = res.data;
  
      // Guardar en cookies
      Cookies.set("dni", data.dni);
      Cookies.set("nombre", data.nombre);
      Cookies.set("rol", data.rol);
  
      // Actualizar contexto
      setUser(data);
  
      // Redirigir según el rol
      if (data.rol === "Administrador") {
        router.push("/dashboard/administrator");
      } else if (data.rol === "Recepcionista") {
        router.push("/dashboard/receptionist");
      } else {
        router.push("/dashboard/member");
      }
    } catch (error) {
      console.error("Error en login:", error);
    }
  };
  

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Ingresar</h1>
      <input
        type="text"
        value={dni}
        onChange={(e) => setDni(e.target.value)}
        placeholder="Ingresá tu DNI"
        className="border p-2 w-full mb-4"
      />
      <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded">
        Ingresar
      </button>
    </div>
  );
};

export default LoginPage;
