package services

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type TokenPayload struct {
	Id string `json:"id"`
}

type customClaims struct {
	TokenPayload
	jwt.RegisteredClaims
}

func CreateAccessToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("ACCESS_TOKEN")))
}

func CreateRefreshToken(payload TokenPayload) (string, error) {
	claims := customClaims{
		payload,
		jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour * 24 * 30)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("REFRESH_TOKEN")))
}
